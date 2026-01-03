import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Product, Category, Review } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../prisma/prisma.service';

import { MinioService } from '../minio/minio.service';

export type ProductWithRelations = Product & {
  category?: Category;
  reviews?: Review[];
};

export type TransformedProduct = Product & {
  category?: Category;
  reviews?: Review[];
  averageRating: number;
  reviewCount: number;
};

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minioService: MinioService,
  ) {}

  private async transformProduct(
    product: ProductWithRelations,
  ): Promise<TransformedProduct> {
    const transformed = {
      ...product,
      averageRating: 0,
      reviewCount: 0,
    } as TransformedProduct;

    // Transform images
    if (transformed.images && Array.isArray(transformed.images)) {
      if (this.minioService.isAvailable()) {
        const urls = await Promise.all(
          transformed.images.map(async (key: string) => {
            if (key.startsWith('http')) return key;
            return await this.minioService.getPresignedDownloadUrl(key);
          }),
        );
        transformed.images = urls;
      }
    }

    // Transform detailedDescription (it's a Minio Key)
    if (
      transformed.detailedDescription &&
      !transformed.detailedDescription.startsWith('http')
    ) {
      if (this.minioService.isAvailable()) {
        transformed.detailedDescription =
          await this.minioService.getPresignedDownloadUrl(
            transformed.detailedDescription,
          );
      }
    }

    // Calculate average rating if reviews are included
    if (transformed.reviews && Array.isArray(transformed.reviews)) {
      let total = 0;
      for (const review of transformed.reviews) {
        total += review.rating || 0;
      }
      transformed.averageRating =
        transformed.reviews.length > 0
          ? parseFloat((total / transformed.reviews.length).toFixed(1))
          : 0;
      transformed.reviewCount = transformed.reviews.length;
    }

    return transformed;
  }

  async create(createDto: CreateProductDto): Promise<TransformedProduct> {
    const category = await this.prisma.category.findUnique({
      where: { id: createDto.categoryId },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const saved = await this.prisma.product.create({
      data: {
        // Use provided ID if available (for consistent file upload paths)
        // Otherwise, Prisma will auto-generate a UUID
        ...(createDto.id && { id: createDto.id }),
        name: createDto.name,
        price: createDto.price,
        images: createDto.images || [],
        description: createDto.description || [],
        detailedDescription: createDto.detailedDescription,
        categoryId: createDto.categoryId,
        isFeatured: createDto.isFeatured ?? false,
        showPrice: createDto.showPrice ?? true,
      },
      include: { category: true, reviews: true },
    });
    return this.transformProduct(saved);
  }

  async findAll(
    page = 1,
    limit = 10,
    categoryId?: number,
    search?: string,
  ): Promise<{
    data: TransformedProduct[];
    total: number;
    page: number;
    limit: number;
  }> {
    const where = {
      deletedAt: null,
      ...(categoryId && { categoryId }),
      ...(search && {
        name: {
          contains: search,
          mode: 'insensitive' as const,
        },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { category: true, reviews: true },
        orderBy: [{ orderIndex: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    const transformedData = await Promise.all(
      data.map((item) => this.transformProduct(item)),
    );

    return { data: transformedData, total, page, limit };
  }

  async findOne(id: string): Promise<TransformedProduct> {
    const found = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: { category: true, reviews: true },
    });
    if (!found) {
      throw new NotFoundException('Product not found');
    }
    return this.transformProduct(found);
  }

  async update(
    id: string,
    updateDto: UpdateProductDto,
  ): Promise<TransformedProduct> {
    const found = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
    });
    if (!found) {
      throw new NotFoundException('Product not found');
    }

    if (updateDto.categoryId !== undefined) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateDto.categoryId },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    // Handle physical deletion of images from MinIO
    if (
      updateDto.deletedImages &&
      updateDto.deletedImages.length > 0 &&
      this.minioService.isAvailable()
    ) {
      for (const key of updateDto.deletedImages) {
        try {
          await this.minioService.deleteObject(key);
        } catch (error) {
          console.error(`Failed to delete image ${key} from MinIO:`, error);
          // We don't throw here to ensure the update continues
        }
      }
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        ...(updateDto.name !== undefined && { name: updateDto.name }),
        ...(updateDto.price !== undefined && { price: updateDto.price }),
        ...(updateDto.images !== undefined && { images: updateDto.images }),
        ...(updateDto.description !== undefined && {
          description: updateDto.description,
        }),
        ...(updateDto.detailedDescription !== undefined && {
          detailedDescription: updateDto.detailedDescription,
        }),
        ...(updateDto.categoryId !== undefined && {
          categoryId: updateDto.categoryId,
        }),
        ...(updateDto.isFeatured !== undefined && {
          isFeatured: updateDto.isFeatured,
        }),
        ...(updateDto.showPrice !== undefined && {
          showPrice: updateDto.showPrice,
        }),
      },
      include: { category: true, reviews: true },
    });

    // Handle physical deletion of OLD detailedDescription if it was updated
    if (
      updateDto.detailedDescription !== undefined &&
      found.detailedDescription &&
      found.detailedDescription !== updateDto.detailedDescription &&
      this.minioService.isAvailable()
    ) {
      try {
        await this.minioService.deleteObject(found.detailedDescription);
      } catch (error) {
        console.error(
          `Failed to delete old detailedDescription ${found.detailedDescription}:`,
          error,
        );
      }
    }

    return this.transformProduct(updated);
  }

  async findFeatured(
    page = 1,
    perPage = 10,
  ): Promise<{
    pagination: { total: number; page: number; perpage: number };
    data: TransformedProduct[];
  }> {
    const where = { deletedAt: null, isFeatured: true };

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { category: true, reviews: true },
        orderBy: [{ orderIndex: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.product.count({ where }),
    ]);

    const transformedData = await Promise.all(
      data.map((item) => this.transformProduct(item)),
    );

    return {
      pagination: {
        total,
        page,
        perpage: perPage,
      },
      data: transformedData,
    };
  }

  async remove(id: string): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Physical cleanup from MinIO
    if (this.minioService.isAvailable()) {
      // 1. Delete the entire product folder (recommended structure)
      await this.minioService.deleteObjectsByPrefix(`products/${id}/`);

      // 2. Delete the detailedDescription specifically if it was stored elsewhere
      if (
        product.detailedDescription &&
        !product.detailedDescription.startsWith(`products/${id}/`)
      ) {
        try {
          await this.minioService.deleteObject(product.detailedDescription);
        } catch (error) {
          console.error(
            `Failed to delete detailedDescription ${product.detailedDescription}:`,
            error,
          );
        }
      }
    }

    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async likeProduct(productId: string, userId: number) {
    // Check if product exists
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if user already liked this product
    const existingLike = await this.prisma.productLike.findUnique({
      where: {
        productId_userId: {
          productId,
          userId,
        },
      },
    });

    if (existingLike) {
      throw new BadRequestException('You have already liked this product');
    }

    // Create like record and increment likes count
    await this.prisma.$transaction([
      this.prisma.productLike.create({
        data: {
          productId,
          userId,
        },
      }),
      this.prisma.product.update({
        where: { id: productId },
        data: {
          likes: {
            increment: 1,
          },
        },
      }),
    ]);

    // Return updated product info
    const updated = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        likes: true,
      },
    });
    return updated;
  }

  async unlikeProduct(productId: string, userId: number) {
    // Check if product exists
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if user has liked this product
    const existingLike = await this.prisma.productLike.findUnique({
      where: {
        productId_userId: {
          productId,
          userId,
        },
      },
    });

    if (!existingLike) {
      throw new BadRequestException('You have not liked this product yet');
    }

    // Delete like record and decrement likes count
    await this.prisma.$transaction([
      this.prisma.productLike.delete({
        where: {
          productId_userId: {
            productId,
            userId,
          },
        },
      }),
      this.prisma.product.update({
        where: { id: productId },
        data: {
          likes: {
            decrement: 1,
          },
        },
      }),
    ]);

    // Return updated product info
    const updated = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        likes: true,
      },
    });
    return updated;
  }

  async checkUserLiked(productId: string, userId: number): Promise<boolean> {
    const like = await this.prisma.productLike.findUnique({
      where: {
        productId_userId: {
          productId,
          userId,
        },
      },
    });

    return !!like;
  }
  async reorder(items: { id: string; orderIndex: number }[]) {
    // Transaction to update all items
    return await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.product.update({
          where: { id: item.id },
          data: { orderIndex: item.orderIndex },
        }),
      ),
    );
  }
}
