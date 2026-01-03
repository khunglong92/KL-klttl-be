import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactInfoDto } from './dto/create-contact-info.dto';
import { UpdateContactInfoDto } from './dto/update-contact-info.dto';
import type { ContactInfo } from '@prisma/client';

@Injectable()
export class ContactInfoService {
  private readonly logger = new Logger(ContactInfoService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Sanitize data to remove invalid date values
   * This prevents "Invalid Date" errors when null is converted to new Date(null)
   */
  private sanitizeData<T extends Record<string, unknown>>(data: T): T {
    const sanitized = { ...data };

    // Handle foundingDate - remove if null, undefined, or invalid
    if ('foundingDate' in sanitized) {
      const fd = sanitized['foundingDate'];
      if (fd === null || fd === undefined) {
        delete sanitized['foundingDate'];
      } else if (fd instanceof Date && isNaN(fd.getTime())) {
        // Invalid Date object
        delete sanitized['foundingDate'];
      } else if (typeof fd === 'string') {
        const parsed = new Date(fd);
        if (isNaN(parsed.getTime())) {
          delete sanitized['foundingDate'];
        } else {
          (sanitized as Record<string, unknown>)['foundingDate'] = parsed;
        }
      }
    }

    return sanitized;
  }

  /**
   * Lấy thông tin liên hệ (chỉ có 1 bản ghi duy nhất)
   * Nếu chưa có, trả về null
   */
  async getContactInfo(): Promise<ContactInfo | null> {
    this.logger.debug('Getting contact info');
    const contactInfo = await this.prisma.contactInfo.findFirst({
      orderBy: {
        createdAt: 'asc', // Lấy bản ghi đầu tiên được tạo
      },
    });

    if (!contactInfo) {
      this.logger.warn('Contact info not found');
      return null;
    }

    this.logger.log('Contact info retrieved successfully');
    return contactInfo;
  }

  /**
   * Tạo thông tin liên hệ (chỉ được tạo nếu chưa có bản ghi nào)
   */
  async createContactInfo(
    createDto: CreateContactInfoDto,
  ): Promise<ContactInfo> {
    this.logger.debug('Creating contact info');

    // Kiểm tra xem đã có bản ghi chưa
    const existing = await this.prisma.contactInfo.findFirst();
    if (existing) {
      this.logger.warn('Contact info already exists, cannot create new one');
      throw new ConflictException(
        'Thông tin liên hệ đã tồn tại. Vui lòng sử dụng API cập nhật.',
      );
    }

    const sanitizedData = this.sanitizeData(
      createDto as unknown as Record<string, unknown>,
    );
    const contactInfo = await this.prisma.contactInfo.create({
      data: sanitizedData as unknown as CreateContactInfoDto,
    });

    this.logger.log('Contact info created successfully');
    return contactInfo;
  }

  /**
   * Cập nhật thông tin liên hệ
   * Nếu chưa có bản ghi, sẽ tạo mới
   */
  async updateContactInfo(
    updateDto: UpdateContactInfoDto,
  ): Promise<ContactInfo> {
    this.logger.debug('Bắt đầu quá trình cập nhật thông tin liên hệ.');
    this.logger.verbose(`Dữ liệu nhận được: ${JSON.stringify(updateDto)}`);

    try {
      this.logger.debug('Đang tìm kiếm thông tin liên hệ hiện có...');
      const existing = await this.prisma.contactInfo.findFirst({
        orderBy: {
          createdAt: 'asc',
        },
      });

      if (!existing) {
        this.logger.warn(
          'Không tìm thấy thông tin liên hệ. Tiến hành tạo mới.',
        );

        this.logger.debug('Kiểm tra dữ liệu để tạo mới...');
        if (
          !updateDto.companyName ||
          !updateDto.address ||
          !updateDto.phone ||
          !updateDto.email ||
          !updateDto.workingHours
        ) {
          this.logger.error(
            'Dữ liệu không đủ để tạo mới. Yêu cầu các trường bắt buộc.',
          );
          throw new NotFoundException(
            'Chưa có thông tin liên hệ. Vui lòng cung cấp đầy đủ thông tin để tạo mới.',
          );
        }

        this.logger.debug('Đang tạo bản ghi mới...');
        const sanitizedData = this.sanitizeData(
          updateDto as unknown as Record<string, unknown>,
        );
        const contactInfo = await this.prisma.contactInfo.create({
          data: sanitizedData as unknown as CreateContactInfoDto,
        });

        this.logger.log('Tạo mới thông tin liên hệ thành công.');
        this.logger.verbose(`Dữ liệu đã tạo: ${JSON.stringify(contactInfo)}`);
        return contactInfo;
      }

      this.logger.debug(
        `Tìm thấy bản ghi hiện có với ID: ${existing.id}. Tiến hành cập nhật.`,
      );
      const sanitizedData = this.sanitizeData(
        updateDto as unknown as Record<string, unknown>,
      );
      const updated = await this.prisma.contactInfo.update({
        where: {
          id: existing.id,
        },
        data: sanitizedData,
      });

      this.logger.log('Cập nhật thông tin liên hệ thành công.');
      this.logger.verbose(`Dữ liệu đã cập nhật: ${JSON.stringify(updated)}`);
      return updated;
    } catch (error) {
      this.logger.error(
        'Đã xảy ra lỗi trong quá trình cập nhật thông tin liên hệ.',
        error instanceof Error ? error.stack : String(error),
      );
      throw error; // Re-throw the error to be handled by NestJS
    }
  }

  /**
   * Xóa thông tin liên hệ (chỉ dùng cho admin)
   */
  async deleteContactInfo(): Promise<{ message: string }> {
    this.logger.debug('Deleting contact info');

    const existing = await this.prisma.contactInfo.findFirst();
    if (!existing) {
      throw new NotFoundException('Không tìm thấy thông tin liên hệ');
    }

    await this.prisma.contactInfo.delete({
      where: {
        id: existing.id,
      },
    });

    this.logger.log('Contact info deleted successfully');
    return { message: 'Xóa thông tin liên hệ thành công' };
  }
}
