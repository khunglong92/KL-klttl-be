import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiChatSettingsService } from './ai-chat-settings.service';
import {
  AiProviderProfileService,
  RuntimeProviderConfig,
} from './ai-provider-profile.service';
import { AiChatRagService } from './ai-chat-rag.service';
import {
  AiChatOpenAiClientService,
  ChatCompletionMessage,
} from './ai-chat-openai-client.service';
import { AiChatErrorLogService } from './ai-chat-error-log.service';
import { AiChatRole } from '@prisma/client';

const MAX_HISTORY_MESSAGES = 6;

@Injectable()
export class AiChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: AiChatSettingsService,
    private readonly providerProfileService: AiProviderProfileService,
    private readonly ragService: AiChatRagService,
    private readonly openaiClient: AiChatOpenAiClientService,
    private readonly errorLogService: AiChatErrorLogService,
  ) {}

  private async getHistory(
    sessionId: string,
  ): Promise<ChatCompletionMessage[]> {
    const rows = await this.prisma.aiChatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: MAX_HISTORY_MESSAGES,
    });
    return rows.reverse().map((row) => ({
      role: row.role === AiChatRole.USER ? 'user' : 'assistant',
      content: row.content,
    }));
  }

  /**
   * Thử tuần tự các provider đang bật theo priority. Chỉ chuyển sang provider
   * kế tiếp nếu provider hiện tại lỗi TRƯỚC KHI phát ra token đầu tiên — một
   * khi đã stream được 1 phần cho client thì không thể "quay lại" đổi provider
   * giữa dòng, lỗi giữa dòng sẽ được ném ra như bình thường.
   */
  private async *streamWithFallback(
    providers: RuntimeProviderConfig[],
    messages: ChatCompletionMessage[],
    temperature: number,
    sessionId: string,
  ): AsyncGenerator<string> {
    let lastError: unknown;

    for (const provider of providers) {
      const generator = this.openaiClient.streamChatCompletion({
        baseUrl: provider.baseUrl,
        apiKey: provider.apiKey,
        model: provider.model,
        messages,
        temperature,
      });

      let first: IteratorResult<string>;
      try {
        first = await generator.next();
      } catch (err) {
        lastError = err;
        await this.errorLogService.log({
          sessionId,
          providerName: provider.name,
          errorMessage: err instanceof Error ? err.message : String(err),
        });
        continue; // thử provider kế tiếp
      }

      if (!first.done) yield first.value;
      yield* generator;
      return;
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('Tất cả provider AI đã cấu hình đều lỗi.');
  }

  async *sendMessage(
    sessionId: string,
    message: string,
  ): AsyncGenerator<string> {
    const [settings, providers] = await Promise.all([
      this.settingsService.getRuntimeConfig(),
      this.providerProfileService.getActiveProvidersForRuntime(),
    ]);

    if (!settings.isEnabled || providers.length === 0) {
      throw new Error('CHAT_DISABLED');
    }

    const [context, history] = await Promise.all([
      this.ragService.buildContext(message),
      this.getHistory(sessionId),
    ]);

    await this.prisma.aiChatMessage.create({
      data: { sessionId, role: AiChatRole.USER, content: message },
    });

    const messages: ChatCompletionMessage[] = [
      {
        role: 'system',
        content: `${settings.systemPrompt}\n\n--- DỮ LIỆU THAM KHẢO (RAG) ---\n${context}`,
      },
      ...history,
      { role: 'user', content: message },
    ];

    let assembled = '';
    try {
      for await (const token of this.streamWithFallback(
        providers,
        messages,
        settings.temperature,
        sessionId,
      )) {
        assembled += token;
        yield token;
      }
    } catch (err) {
      await this.errorLogService.log({
        sessionId,
        providerName: 'ALL',
        errorMessage: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }

    if (assembled.trim().length > 0) {
      await this.prisma.aiChatMessage.create({
        data: {
          sessionId,
          role: AiChatRole.ASSISTANT,
          content: assembled,
        },
      });
    }
  }
}
