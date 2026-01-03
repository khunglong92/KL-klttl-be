import { Injectable, NotFoundException } from '@nestjs/common';

import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { Contact } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Định nghĩa kiểu dữ liệu cho kết quả phân trang để code sạch hơn
type PaginatedContactsResult = {
  data: Contact[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo một liên hệ mới
   * @param createContactDto Dữ liệu để tạo liên hệ
   * @returns Liên hệ vừa được tạo
   */
  async create(createContactDto: CreateContactDto): Promise<Contact> {
    return await this.prisma.contact.create({ data: createContactDto });
  }

  /**
   * Lấy danh sách liên hệ có phân trang
   * @param page Số trang hiện tại
   * @param limit Số lượng mục trên mỗi trang
   * @returns Danh sách liên hệ và thông tin phân trang
   */
  async findAll(page: number, limit: number): Promise<PaginatedContactsResult> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.contact.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contact.count(),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Lấy chi tiết một liên hệ theo ID
   * @param id ID của liên hệ (UUID)
   * @returns Chi tiết liên hệ
   */
  async findOne(id: string): Promise<Contact> {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
    });

    if (!contact) {
      throw new NotFoundException(`Không tìm thấy liên hệ với ID: ${id}`);
    }

    return contact;
  }

  /**
   * Cập nhật trạng thái 'đã xác nhận' của một liên hệ
   * @param id ID của liên hệ (UUID)
   * @param updateContactDto Dữ liệu cập nhật (chỉ chứa isConfirmed)
   * @returns Liên hệ sau khi đã cập nhật
   */
  async updateStatus(
    id: string,
    updateContactDto: UpdateContactDto,
  ): Promise<Contact> {
    await this.findOne(id); // Đảm bảo liên hệ tồn tại
    return await this.prisma.contact.update({
      where: { id },
      data: { isConfirmed: !!updateContactDto.isConfirmed },
    });
  }

  /**
   * Xóa một liên hệ
   * @param id ID của liên hệ (UUID)
   */
  async remove(id: string): Promise<void> {
    await this.findOne(id); // Đảm bảo liên hệ tồn tại
    await this.prisma.contact.delete({ where: { id } });
  }
}
