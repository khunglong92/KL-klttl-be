import { Injectable } from '@nestjs/common';

const CONNECT_TIMEOUT_MS = 30_000;
const STALL_TIMEOUT_MS = 45_000;

export interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface StreamChatCompletionOptions {
  baseUrl: string;
  apiKey: string | null;
  model: string;
  messages: ChatCompletionMessage[];
  temperature: number;
}

export interface TestConnectionResult {
  ok: boolean;
  message: string;
}

@Injectable()
export class AiChatOpenAiClientService {
  private buildUrl(baseUrl: string): string {
    return `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
  }

  private buildHeaders(apiKey: string | null): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
    return headers;
  }

  async *streamChatCompletion(
    opts: StreamChatCompletionOptions,
  ): AsyncGenerator<string> {
    const connectController = new AbortController();
    const connectTimer = setTimeout(
      () => connectController.abort(),
      CONNECT_TIMEOUT_MS,
    );

    let response: Response;
    try {
      response = await fetch(this.buildUrl(opts.baseUrl), {
        method: 'POST',
        headers: this.buildHeaders(opts.apiKey),
        body: JSON.stringify({
          model: opts.model,
          messages: opts.messages,
          temperature: opts.temperature,
          stream: true,
        }),
        signal: connectController.signal,
      });
    } finally {
      clearTimeout(connectTimer);
    }

    if (!response.ok || !response.body) {
      const text = await response.text().catch(() => '');
      throw new Error(
        `Provider trả về lỗi (${response.status}): ${text || response.statusText}`,
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        let timeoutId: NodeJS.Timeout | undefined;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(
            () => reject(new Error('Provider không phản hồi (timeout)')),
            STALL_TIMEOUT_MS,
          );
        });
        try {
          const { done, value } = await Promise.race([
            reader.read(),
            timeoutPromise,
          ]);
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          buffer = buffer.replace(/\r\n/g, '\n');
        } finally {
          if (timeoutId) clearTimeout(timeoutId);
        }

        let sepIndex: number;
        while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
          const rawEvent = buffer.slice(0, sepIndex);
          buffer = buffer.slice(sepIndex + 2);

          for (const line of rawEvent.split('\n')) {
            if (!line.startsWith('data:')) continue;
            const data = line.slice(5).trim();
            if (data === '[DONE]') return;
            try {
              const parsed = JSON.parse(data) as {
                choices?: { delta?: { content?: string } }[];
              };
              const token = parsed.choices?.[0]?.delta?.content;
              if (token) yield token;
            } catch {
              // ignore malformed SSE chunk
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async testConnection(opts: {
    baseUrl: string;
    apiKey: string | null;
    model: string;
  }): Promise<TestConnectionResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CONNECT_TIMEOUT_MS);
    try {
      const response = await fetch(this.buildUrl(opts.baseUrl), {
        method: 'POST',
        headers: this.buildHeaders(opts.apiKey),
        body: JSON.stringify({
          model: opts.model,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 1,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        return {
          ok: false,
          message: `Provider trả về lỗi (${response.status}): ${text || response.statusText}`,
        };
      }
      return { ok: true, message: 'Kết nối thành công' };
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : 'Không thể kết nối tới provider',
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
