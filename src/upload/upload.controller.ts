import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  ValidationPipe,
  Delete,
  Query,
  BadRequestException,
  Param,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { UploadDto } from './dto/upload.dto';
import {
  GetPresignedUploadUrlDto,
  GetPresignedUploadUrlResponseDto,
  GetFileUrlDto,
  GetFileUrlResponseDto,
  GetMultipleFileUrlsDto,
  GetMultipleFileUrlsResponseDto,
} from '../minio/minio.dto';

class UploadImageResponse {
  url: string;
  public_id: string;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
}

@ApiTags('Uploads')
@ApiBearerAuth()
@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  private shouldSkipWatermark(folder?: string): boolean {
    if (!folder) return false;
    const sanitized = folder.toLowerCase();
    return sanitized.split('/').some((segment) => segment === 'quote');
  }

  private normalizePublicId(raw?: string): string {
    const trimmed = raw?.trim();

    if (!trimmed) {
      throw new BadRequestException('public_id is required');
    }

    let normalized = trimmed;

    // 1. Priority: Match known entity patterns FIRST
    // This is the most robust way because it ignores bucket/host differences
    const patterns = [
      /(products\/.+)/,
      /(projects\/.+)/,
      /(services\/.+)/,
      /(posts\/.+)/,
      /(users\/.+)/,
      /(avatars\/.+)/,
      /(banners\/.+)/,
      /(categories\/.+)/,
      /(quotes\/.+)/,
      /(general\/.+)/,
    ];

    for (const pattern of patterns) {
      const match = normalized.match(pattern);
      if (match && match[1]) {
        // Remove any query parameters if present in the match
        return match[1].split('?')[0];
      }
    }

    // If user passes the full URL, extract the part after /uploads/
    if (/^https?:\/\//i.test(normalized)) {
      try {
        const url = new URL(normalized);
        const uploadsIndex = url.pathname.indexOf('/uploads/');
        if (uploadsIndex >= 0) {
          normalized = url.pathname.slice(uploadsIndex + '/uploads/'.length);
        } else {
          normalized = url.pathname.replace(/^\/+/, '');
        }
      } catch {
        normalized = normalized.replace(/^https?:\/\//i, '');
      }
    }

    if (normalized.startsWith('uploads/')) {
      normalized = normalized.slice('uploads/'.length);
    }

    normalized = normalized.replace(/^\/+|\/+$/g, '');

    if (!normalized) {
      throw new BadRequestException('public_id is required');
    }

    return normalized;
  }

  // ============================================
  // NEW ENDPOINTS FOR MINIO PRESIGNED URL UPLOAD
  // ============================================

  @Post('presigned-url')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lấy presigned URL để upload file trực tiếp lên MinIO',
    description:
      'Client sẽ dùng URL này để PUT file trực tiếp lên MinIO. Sau đó lưu key vào database.',
  })
  @ApiBody({ type: GetPresignedUploadUrlDto })
  @ApiResponse({
    status: 201,
    type: GetPresignedUploadUrlResponseDto,
    description: 'Trả về presigned URL và key để lưu vào DB',
  })
  async getPresignedUploadUrl(
    @Body(new ValidationPipe()) body: GetPresignedUploadUrlDto,
  ): Promise<GetPresignedUploadUrlResponseDto> {
    return this.uploadService.getPresignedUploadUrl(body);
  }

  @Post('file-url')
  @ApiOperation({
    summary: 'Lấy presigned download URL từ key',
    description:
      'Dùng để lấy URL tạm thời để hiển thị file. URL có thời hạn 1 giờ.',
  })
  @ApiBody({ type: GetFileUrlDto })
  @ApiResponse({
    status: 201,
    type: GetFileUrlResponseDto,
    description: 'Trả về presigned URL để download/view file',
  })
  async getFileUrl(
    @Body(new ValidationPipe()) body: GetFileUrlDto,
  ): Promise<GetFileUrlResponseDto> {
    return this.uploadService.getFileUrl(body.key);
  }

  @Post('file-urls')
  @ApiOperation({
    summary: 'Lấy presigned download URLs cho nhiều keys',
    description: 'Batch endpoint để lấy URLs cho nhiều files cùng lúc.',
  })
  @ApiBody({ type: GetMultipleFileUrlsDto })
  @ApiResponse({
    status: 201,
    type: GetMultipleFileUrlsResponseDto,
    description: 'Trả về object mapping key -> presigned URL',
  })
  async getMultipleFileUrls(
    @Body(new ValidationPipe()) body: GetMultipleFileUrlsDto,
  ): Promise<GetMultipleFileUrlsResponseDto> {
    const urls = await this.uploadService.getMultipleFileUrls(body.keys);
    return { urls };
  }

  // ============================================
  // LEGACY ENDPOINTS (backward compatibility)
  // ============================================

  @Post('image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Upload ảnh lên server (có đóng dấu logo, trừ folder quote)',
    description:
      'Upload ảnh với folder tùy chỉnh. Folder có thể chứa dấu / để tạo cấu trúc thư mục. Folder quote sẽ không có watermark.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description:
      'Form upload ảnh với folder tùy chỉnh (vd: products, services, banners, etc.)',
    type: UploadDto,
  })
  @ApiResponse({
    status: 201,
    type: UploadImageResponse,
    description: 'Trả về URL và public_id của ảnh đã upload',
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: unknown,
    @Body(new ValidationPipe()) body: UploadDto,
  ) {
    let buffer: Buffer = Buffer.alloc(0);
    const anyFile = (file as Record<string, unknown>) || null;
    const possibleBuffer = anyFile && anyFile['buffer'];
    const mimetype = (anyFile && (anyFile['mimetype'] as string)) || '';

    if (possibleBuffer instanceof Buffer) {
      buffer = possibleBuffer;
    }
    const skipWatermark = this.shouldSkipWatermark(body.folder);
    return this.uploadService.uploadImage(
      buffer,
      body.folder,
      undefined,
      undefined,
      {
        skipWatermark,
        productId: body.productId,
        mimetype,
      },
    );
  }

  @Delete('image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Xoá ảnh trên server',
    description:
      'Xoá ảnh bằng public_id (full path). Có thể truyền qua query (?public_id=...) hoặc append trực tiếp sau /image/. Ví dụ: DELETE /uploads/image/products/1/product-name/abc123.jpg',
  })
  @ApiQuery({
    name: 'public_id',
    description: 'Full path của ảnh cần xóa (bao gồm folder và tên file)',
    example:
      'products/1/product-name/28f6f727-12db-41e7-bd27-38e5e32c9dfd.jpeg',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Xoá thành công. Các folder rỗng sẽ tự động được xoá.',
  })
  @ApiResponse({
    status: 400,
    description: 'Không tìm thấy ảnh hoặc public_id không hợp lệ',
  })
  async deleteImage(@Query('public_id') publicId: string) {
    const normalizedPublicId = this.normalizePublicId(publicId);
    return this.uploadService.deleteImage(normalizedPublicId);
  }

  @Delete('image/*path')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Xoá ảnh trên server bằng RESTful path',
    description:
      'Cho phép gọi DELETE /uploads/image/{public_id}. Cũng hỗ trợ query public_id để tương thích với client cũ.',
  })
  async deleteImageWithPath(
    @Param('path') publicIdFromPath: string,
    @Query('public_id') publicIdFromQuery?: string,
  ) {
    const normalizedPublicId = this.normalizePublicId(
      publicIdFromQuery || publicIdFromPath,
    );

    const result = await this.uploadService.deleteImage(normalizedPublicId);

    return result;
  }
}
