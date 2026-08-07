import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateChatSettingsDto } from './dto/update-chat-settings.dto';
import type { AiChatSettings } from '@prisma/client';

const DEFAULT_SYSTEM_PROMPT =
  'Bạn là trợ lý AI của Kim Loại Tấm Thiên Lộc, một doanh nghiệp chuyên cung cấp kim loại tấm, sản phẩm và dịch vụ gia công liên quan. ' +
  'Trả lời ngắn gọn, thân thiện, chính xác bằng tiếng Việt, CHỈ dựa trên dữ liệu trong phần DỮ LIỆU THAM KHẢO (RAG) được cung cấp, không tự bịa thông tin không có trong đó. ' +
  'QUAN TRỌNG: nếu trong DỮ LIỆU THAM KHẢO có mục cụ thể khớp với câu hỏi (sản phẩm, dịch vụ, tin tức/danh mục, tin tuyển dụng), PHẢI trả lời bằng CHÍNH TÊN mục đó (không diễn giải chung, không gộp nhiều mục thành 1 câu mô tả mơ hồ), và LUÔN kèm đường link dạng markdown [Tên](URL) lấy đúng từ dữ liệu tham khảo để khách bấm vào xem chi tiết ngay — mỗi mục liên quan nên có 1 dòng riêng kèm link riêng. Không tự tạo link không có trong dữ liệu tham khảo. ' +
  'Lưu ý: mục "Tin tức/Danh mục sản phẩm" trong dữ liệu tham khảo cũng có thể chính là kết quả sản phẩm khách đang hỏi (không chỉ là bài viết blog thông thường) — vẫn phải nêu đích danh và kèm link như trên. ' +
  'Nếu không tìm thấy mục nào phù hợp trong dữ liệu tham khảo, hãy nói rõ là chưa có thông tin cụ thể và đề nghị khách hàng liên hệ trực tiếp với công ty, không trả lời chung chung để né tránh.';

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
