import {
  Controller,
  Get,
  UseGuards,
  Request,
  Query,
  Body,
  Delete,
  Param,
  Patch,
} from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiProperty,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { UsersService } from './users.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { UploadService } from '../upload/upload.service';

class UserProfileResponse {
  @ApiProperty({ description: 'ID người dùng', example: 1 })
  id: number;

  @ApiProperty({ description: 'Tên người dùng', example: 'John Doe' })
  name: string;

  @ApiProperty({ description: 'Email người dùng', example: 'user@example.com' })
  email: string;

  @ApiProperty({
    description: 'Vai trò người dùng',
    example: 'USER',
    enum: ['ADMIN', 'USER', 'MANAGER'],
  })
  role: string;

  @ApiProperty({
    description: 'Ngày sinh',
    example: '2000-01-01',
    required: false,
    nullable: true,
  })
  dateOfBirth: string | null;

  @ApiProperty({
    description: 'URL ảnh đại diện',
    example: 'https://example.com/avatar.png',
    required: false,
    nullable: true,
  })
  avtUrl: string | null;

  @ApiProperty({
    description: 'Ngày tạo tài khoản',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Ngày cập nhật gần nhất',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly uploadService: UploadService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Danh sách người dùng (có phân trang)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Số trang (mặc định là 1)',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Số lượng người dùng mỗi trang (mặc định là 10, tối đa 100)',
    type: Number,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Tìm kiếm theo tên hoặc email',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách người dùng với phân trang',
  })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const p = Number(page) > 0 ? Number(page) : 1;
    const l = Number(limit) > 0 && Number(limit) <= 100 ? Number(limit) : 10;
    return this.usersService.findAll(p, l, search);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật người dùng' })
  update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      role?: UserRole;
      dateOfBirth?: string;
      avtUrl?: string;
    },
  ) {
    return this.usersService.update(Number(id), body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xoá người dùng (soft delete)' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(Number(id));
  }
  /**
   * Get current user's profile
   * @param req - The request object containing the authenticated user
   * @returns The user's profile information
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lấy thông tin profile người dùng hiện tại',
    description:
      'Trả về thông tin profile của người dùng đang đăng nhập dựa trên JWT token',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin profile thành công',
    type: UserProfileResponse, // Swagger will use this class for schema generation
  })
  @ApiUnauthorizedResponse({
    description: 'Không có quyền truy cập - Token không hợp lệ hoặc đã hết hạn',
  })
  async getProfile(@Request() req: { user: UserProfileResponse }) {
    const user = req.user;
    if (user.avtUrl) {
      const { url } = await this.uploadService.getFileUrl(user.avtUrl);
      user.avtUrl = url;
    }
    return user;
  }
}
