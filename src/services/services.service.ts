import { Injectable, NotFoundException } from '@nestjs/common';
import { Service, ServiceStatus, Review } from '@prisma/client';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PrismaService } from '../prisma/prisma.service';

import { MinioService } from '../minio/minio.service';

export type ServiceWithRelations = Service & {
  reviews?: Review[];
};

export type TransformedService = Service & {
  averageRating: number;
  reviewCount: number;
};

@Injectable()
export class ServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minioService: MinioService,
  ) {}

  private async transformService(
    service: ServiceWithRelations,
  ): Promise<TransformedService> {
    // if (!service) return service as any;
    const transformed = {
      ...service,
      averageRating: 0,
      reviewCount: 0,
    } as TransformedService;

    // Calculate rating
    if (service.reviews && Array.isArray(service.reviews)) {
      let total = 0;
      for (const review of service.reviews) {
        total += review.rating || 0;
      }
      transformed.averageRating =
        service.reviews.length > 0
          ? parseFloat((total / service.reviews.length).toFixed(1))
          : 0;
      transformed.reviewCount = service.reviews.length;
    }

    if (this.minioService.isAvailable()) {
      // Transform images
      if (transformed.images && Array.isArray(transformed.images)) {
        const urls = await Promise.all(
          transformed.images.map(async (key: string) => {
            if (key.startsWith('http')) return key;
            return await this.minioService.getPresignedDownloadUrl(key);
          }),
        );
        transformed.images = urls;
      }

      // Transform detailedDescription (if it's a Minio Key)
      if (
        transformed.detailedDescription &&
        !transformed.detailedDescription.startsWith('http') &&
        !transformed.detailedDescription.includes(' ')
      ) {
        try {
          transformed.detailedDescription =
            await this.minioService.getPresignedDownloadUrl(
              transformed.detailedDescription,
            );
        } catch {
          // Ignore error if it's not a key
        }
      }
    }

    return transformed;
  }

  async create(dto: CreateServiceDto): Promise<TransformedService> {
    const saved = await this.prisma.service.create({
      data: {
        ...(dto.id && { id: dto.id }),
        name: dto.name,
        shortDescription: dto.shortDescription,

        detailedDescription: dto.detailedDescription,
        hashtags: dto.hashtags || [],
        images: dto.images || [],
        isFeatured: dto.isFeatured || false,
        status: ServiceStatus.published,
      },
      include: { reviews: true },
    });
    return this.transformService(saved);
  }

  async findAll(
    page = 1,
    perPage = 10,
    status?: ServiceStatus,
    search?: string,
  ): Promise<{
    pagination: { total: number; page: number; perpage: number };
    data: TransformedService[];
  }> {
    const where: any = {
      deletedAt: null,
      status: status ?? ServiceStatus.published,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        include: { reviews: true },
        orderBy: [{ orderIndex: 'asc' }, { name: 'asc' }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.service.count({ where }),
    ]);

    const transformedData = await Promise.all(
      data.map((item) => this.transformService(item)),
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

  async findOne(id: string): Promise<TransformedService> {
    const found = await this.prisma.service.findUnique({
      where: { id },
      include: { reviews: true },
    });
    if (!found || found.deletedAt) {
      throw new NotFoundException('Service not found');
    }
    return this.transformService(found);
  }

  async update(id: string, dto: UpdateServiceDto): Promise<TransformedService> {
    const found = await this.prisma.service.findUnique({ where: { id } });
    if (!found || found.deletedAt) {
      throw new NotFoundException('Service not found');
    }

    // Handle physical deletion of images from MinIO
    if (
      dto.deletedImages &&
      dto.deletedImages.length > 0 &&
      this.minioService.isAvailable()
    ) {
      for (const key of dto.deletedImages) {
        try {
          await this.minioService.deleteObject(key);
        } catch (error) {
          console.error(`Failed to delete image ${key} from MinIO:`, error);
        }
      }
    }

    const updated = await this.prisma.service.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.shortDescription !== undefined && {
          shortDescription: dto.shortDescription,
        }),

        ...(dto.detailedDescription !== undefined && {
          detailedDescription: dto.detailedDescription,
        }),
        ...(dto.hashtags !== undefined && { hashtags: dto.hashtags }),
        ...(dto.images !== undefined && { images: dto.images }),
        ...(dto.isFeatured !== undefined && { isFeatured: dto.isFeatured }),
      },
      include: { reviews: true },
    });

    // Handle physical deletion of OLD detailedDescription if it was updated
    if (
      dto.detailedDescription !== undefined &&
      found.detailedDescription &&
      found.detailedDescription !== dto.detailedDescription &&
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

    return this.transformService(updated);
  }

  async findFeatured(
    page = 1,
    perPage = 10,
  ): Promise<{
    pagination: { total: number; page: number; perpage: number };
    data: TransformedService[];
  }> {
    const where = {
      deletedAt: null,
      status: ServiceStatus.published,
    };

    const [data, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        include: { reviews: true },
        orderBy: [{ orderIndex: 'asc' }, { name: 'asc' }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.service.count({ where }),
    ]);

    const transformedData = await Promise.all(
      data.map((item) => this.transformService(item)),
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
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Physical cleanup from MinIO
    if (this.minioService.isAvailable()) {
      await this.minioService.deleteObjectsByPrefix(`services/${id}/`);

      if (
        service.detailedDescription &&
        !service.detailedDescription.startsWith(`services/${id}/`) &&
        !service.detailedDescription.startsWith('http')
      ) {
        try {
          await this.minioService.deleteObject(service.detailedDescription);
        } catch (error) {
          console.error(`Failed to delete detailedDescription:`, error);
        }
      }
    }

    await this.prisma.service.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async reorder(items: { id: string; orderIndex: number }[]) {
    return await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.service.update({
          where: { id: item.id },
          data: { orderIndex: item.orderIndex },
        }),
      ),
    );
  }
}
