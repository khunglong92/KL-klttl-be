import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiChatErrorLogService {
  private readonly logger = new Logger(AiChatErrorLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    sessionId?: string;
    providerName?: string;
    errorMessage: string;
  }): Promise<void> {
    this.logger.warn(
      `AI chat error (provider=${params.providerName ?? 'unknown'}): ${params.errorMessage}`,
    );
    try {
      await this.prisma.aiChatErrorLog.create({
        data: {
          sessionId: params.sessionId,
          providerName: params.providerName,
          errorMessage: params.errorMessage,
        },
      });
    } catch (e) {
      // Không để việc ghi log lỗi làm crash luồng chat chính.
      this.logger.error('Failed to persist AI chat error log', e as Error);
    }
  }

  async getLogs(page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    const [logs, total] = await Promise.all([
      this.prisma.aiChatErrorLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.aiChatErrorLog.count(),
    ]);

    return { page, pageSize, total, logs };
  }
}
