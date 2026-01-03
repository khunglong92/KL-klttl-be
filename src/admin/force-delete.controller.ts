import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../minio/minio.service';

class ForceDeleteDto {
  type: 'category' | 'product' = 'category';
  id: any;
}

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
export class ForceDeleteController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minioService: MinioService,
  ) {}

  @Post('force-delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Xoá cứng một thực thể và quan hệ liên quan' })
  @ApiBody({ schema: { example: { type: 'category', id: 1 } } })
  @ApiResponse({ status: 200, schema: { example: { success: true } } })
  async forceDelete(@Body() body: ForceDeleteDto) {
    if (body.type === 'product') {
      const productId = body.id;

      // Cleanup MinIO data before deleting from DB
      if (this.minioService.isAvailable()) {
        await this.minioService.deleteObjectsByPrefix(`products/${productId}/`);
      }

      await this.prisma.product.delete({ where: { id: productId } });
      return { success: true };
    }

    if (body.type === 'category') {
      const catId =
        typeof body.id === 'string' ? parseInt(body.id, 10) : body.id;

      // Get all products in this category to cleanup MinIO
      const products = await this.prisma.product.findMany({
        where: { categoryId: catId },
        select: { id: true },
      });

      if (this.minioService.isAvailable()) {
        for (const product of products) {
          await this.minioService.deleteObjectsByPrefix(
            `products/${product.id}/`,
          );
        }
      }

      // delete all products in this category then category itself
      await this.prisma.product.deleteMany({ where: { categoryId: catId } });
      await this.prisma.category.delete({ where: { id: catId } });
      return { success: true };
    }
    return { success: false };
  }
}
