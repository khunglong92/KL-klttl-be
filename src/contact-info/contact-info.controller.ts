import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ContactInfoService } from './contact-info.service';
import { CreateContactInfoDto } from './dto/create-contact-info.dto';
import { UpdateContactInfoDto } from './dto/update-contact-info.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole, ContactInfo } from '@prisma/client';

@ApiTags('Contact Info')
@Controller('contact-info')
export class ContactInfoController {
  constructor(private readonly contactInfoService: ContactInfoService) {}

  @Get()
  @ApiOperation({
    summary: 'Lấy thông tin liên hệ công ty',
    description:
      'API công khai để lấy thông tin liên hệ của công ty (chỉ có 1 bản ghi duy nhất)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin thành công',
  })
  @ApiResponse({
    status: 404,
    description: 'Chưa có thông tin liên hệ',
  })
  async getContactInfo(): Promise<ContactInfo | null> {
    return this.contactInfoService.getContactInfo();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Tạo thông tin liên hệ (Admin)',
    description:
      'Tạo thông tin liên hệ mới. Chỉ được tạo nếu chưa có bản ghi nào.',
  })
  @ApiResponse({
    status: 201,
    description: 'Tạo thông tin thành công',
  })
  @ApiResponse({
    status: 400,
    description: 'Thông tin liên hệ đã tồn tại',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa xác thực',
  })
  async createContactInfo(
    @Body() createDto: CreateContactInfoDto,
  ): Promise<ContactInfo> {
    return this.contactInfoService.createContactInfo(createDto);
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cập nhật thông tin liên hệ (Admin)',
    description:
      'Cập nhật thông tin liên hệ. Nếu chưa có bản ghi, sẽ tạo mới (yêu cầu đầy đủ thông tin).',
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thành công',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa xác thực',
  })
  @ApiResponse({
    status: 404,
    description: 'Chưa có thông tin liên hệ và thiếu dữ liệu để tạo mới',
  })
  async updateContactInfo(
    @Body() updateDto: UpdateContactInfoDto,
  ): Promise<ContactInfo> {
    return this.contactInfoService.updateContactInfo(updateDto);
  }

  @Delete()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Xóa thông tin liên hệ (Admin)',
    description: 'Xóa thông tin liên hệ. Chỉ dành cho admin.',
  })
  @ApiResponse({
    status: 200,
    description: 'Xóa thành công',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa xác thực',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy thông tin liên hệ',
  })
  async deleteContactInfo(): Promise<{ message: string }> {
    return this.contactInfoService.deleteContactInfo();
  }
}
