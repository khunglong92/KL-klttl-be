import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateChatSettingsDto } from './dto/update-chat-settings.dto';
import type { AiChatSettings } from '@prisma/client';

const DEFAULT_SYSTEM_PROMPT =
  'Bạn là trợ lý AI của Kim Loại Tấm Thiên Lộc, một doanh nghiệp chuyên cung cấp kim loại tấm, sản phẩm và dịch vụ gia công liên quan. ' +
  'Hãy trả lời ngắn gọn, thân thiện, chính xác bằng tiếng Việt, dựa trên dữ liệu sản phẩm/dịch vụ/thông tin công ty được cung cấp. ' +
  'Nếu không chắc chắn, hãy đề nghị khách hàng liên hệ trực tiếp với công ty.';

export interface AiChatSettingsPublic {
  id: string;
  systemPrompt: string;
  temperature: number;
  isEnabled: boolean;
  updatedAt: Date;
  updatedBy: string | null;
}

@Injectable()
export class AiChatSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOrCreateRow(): Promise<AiChatSettings> {
    const existing = await this.prisma.aiChatSettings.findFirst({
      orderBy: { updatedAt: 'asc' },
    });
    if (existing) return existing;

    return this.prisma.aiChatSettings.create({
      data: {
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        temperature: 0.4,
        isEnabled: false,
      },
    });
  }

  async getSettings(): Promise<AiChatSettingsPublic> {
    return this.getOrCreateRow();
  }

  async updateSettings(
    dto: UpdateChatSettingsDto,
    updatedBy?: string,
  ): Promise<AiChatSettingsPublic> {
    const existing = await this.getOrCreateRow();
    return this.prisma.aiChatSettings.update({
      where: { id: existing.id },
      data: {
        ...(dto.systemPrompt !== undefined && {
          systemPrompt: dto.systemPrompt,
        }),
        ...(dto.temperature !== undefined && { temperature: dto.temperature }),
        ...(dto.isEnabled !== undefined && { isEnabled: dto.isEnabled }),
        updatedBy: updatedBy ?? existing.updatedBy,
      },
    });
  }

  /** Internal use only — for the chat orchestration service. */
  async getRuntimeConfig(): Promise<{
    systemPrompt: string;
    temperature: number;
    isEnabled: boolean;
  }> {
    const settings = await this.getOrCreateRow();
    return {
      systemPrompt: settings.systemPrompt,
      temperature: settings.temperature,
      isEnabled: settings.isEnabled,
    };
  }
}
