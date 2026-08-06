import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiChatSettingsService } from './ai-chat-settings.service';
import { AiProviderProfileService } from './ai-provider-profile.service';
import { AiChatRagService } from './ai-chat-rag.service';
import {
  AiChatOpenAiClientService,
  ChatCompletionMessage,
} from './ai-chat-openai-client.service';
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

  async *sendMessage(
    sessionId: string,
    message: string,
  ): AsyncGenerator<string> {
    const [settings, provider] = await Promise.all([
      this.settingsService.getRuntimeConfig(),
      this.providerProfileService.getActiveDecryptedForRuntime(),
    ]);

    if (!settings.isEnabled || !provider) {
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
    for await (const token of this.openaiClient.streamChatCompletion({
      baseUrl: provider.baseUrl,
      apiKey: provider.apiKey,
      model: provider.model,
      messages,
      temperature: settings.temperature,
    })) {
      assembled += token;
      yield token;
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

  async getLogs(page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;

    const sessions = await this.prisma.aiChatMessage.groupBy({
      by: ['sessionId'],
      _count: { _all: true },
      _max: { createdAt: true },
      orderBy: { _max: { createdAt: 'desc' } },
      skip,
      take: pageSize,
    });

    const countResult = await this.prisma.$queryRaw<
      { count: bigint }[]
    >`SELECT COUNT(DISTINCT session_id) as count FROM ai_chat_messages`;
    const totalSessions = Number(countResult[0]?.count || 0);

    const sessionData = await Promise.all(
      sessions.map(async (s) => {
        const messages = await this.prisma.aiChatMessage.findMany({
          where: { sessionId: s.sessionId },
          orderBy: { createdAt: 'asc' },
        });
        return {
          sessionId: s.sessionId,
          messageCount: s._count._all,
          lastMessageAt: s._max.createdAt,
          messages,
        };
      }),
    );

    return {
      page,
      pageSize,
      totalSessions,
      sessions: sessionData,
    };
  }
}
