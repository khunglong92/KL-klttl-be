import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateChatSettingsDto } from './dto/update-chat-settings.dto';
import type { AiChatSettings } from '@prisma/client';

const DEFAULT_SYSTEM_PROMPT =
  'Bạn là trợ lý AI của Kim Loại Tấm Thiên Lộc, một doanh nghiệp chuyên cung cấp kim loại tấm, sản phẩm và dịch vụ gia công liên quan. ' +
  'Hãy trả lời ngắn gọn, thân thiện, chính xác bằng tiếng Việt, CHỈ dựa trên dữ liệu sản phẩm/dịch vụ/tin tức/tuyển dụng/thông tin công ty được cung cấp trong phần DỮ LIỆU THAM KHẢO (RAG), không tự bịa thông tin không có trong đó. ' +
  'Khi câu trả lời có đề cập đến một sản phẩm, dịch vụ, tin tức hoặc tin tuyển dụng cụ thể có trong dữ liệu tham khảo, LUÔN kèm đường link dạng markdown [Tên](URL) lấy đúng từ dữ liệu tham khảo để khách bấm vào xem chi tiết ngay, không tự tạo link không có trong dữ liệu. ' +
  'Nếu không chắc chắn hoặc không tìm thấy thông tin phù hợp trong dữ liệu tham khảo, hãy nói rõ và đề nghị khách hàng liên hệ trực tiếp với công ty.';

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
