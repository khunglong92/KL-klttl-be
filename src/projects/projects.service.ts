import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../minio/minio.service';
import { Project } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minioService: MinioService,
  ) {}

  private async transformProject(project?: Project) {
    if (!project) return;
    const transformed = { ...project };

    if (this.minioService.isAvailable()) {
      // Transform images
      if (Array.isArray(transformed.images) && transformed.images.length > 0) {
        transformed.images = await Promise.all(
          transformed.images.map(async (img: string) => {
            if (typeof img === 'string' && !img.startsWith('http')) {
              return await this.minioService.getPresignedDownloadUrl(img);
            }
            return img;
          }),
        );
      }

      // Transform detailedDescription (MinIO Key to URL)
      if (
        transformed.detailedDescription &&
        !transformed.detailedDescription.startsWith('http')
      ) {
        try {
          transformed.detailedDescription =
            await this.minioService.getPresignedDownloadUrl(
              transformed.detailedDescription,
            );
        } catch {
          // If fail (e.g. key not found), keep original string (backward compatibility)
        }
      }
    }
    return transformed;
  }

  async create(dto: CreateProjectDto) {
    // Category logic removed

    const saved = await this.prisma.project.create({
      data: {
        title: dto.title,
        shortDescription: dto.shortDescription,
        detailedDescription: dto.detailedDescription,
        images: dto.images ?? [],
        isFeatured: dto.isFeatured ?? false,
        isActive: dto.isActive ?? true,
      },
      include: { reviews: true },
    });
    return this.transformProject(saved);
  }

  async findAll(page = 1, perPage = 10, isFeatured?: boolean) {
    const where: any = {
      deletedAt: null,
    };

    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured;
    }

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
        include: { reviews: true },
      }),
      this.prisma.project.count({ where }),
    ]);

    const transformedData = await Promise.all(
      data.map((item) => this.transformProject(item)),
    );

    return { data: transformedData, total, page, perPage };
  }

  async findOne(id: string) {
    const found = await this.prisma.project.findFirst({
      where: { id, deletedAt: null },
      include: { reviews: true },
    });
    if (!found) throw new NotFoundException('Project not found');
    return this.transformProject(found);
  }

  async update(id: string, dto: UpdateProjectDto) {
    const found = await this.prisma.project.findFirst({
      where: { id, deletedAt: null },
    });
    if (!found) {
      throw new NotFoundException('Project not found');
    }

    // Determine what we need to delete from MinIO
    if (this.minioService.isAvailable()) {
      // 1. Handle deleted images
      if (dto.deletedImages && dto.deletedImages.length > 0) {
        await Promise.all(
          dto.deletedImages.map((img) =>
            this.minioService.deleteObject(img).catch((e) => {
              console.error(`Failed to delete image ${img}`, e);
            }),
          ),
        );
      }

      // 2. Handle detailedDescription update
      if (
        dto.detailedDescription !== undefined &&
        found.detailedDescription &&
        found.detailedDescription !== dto.detailedDescription &&
        !found.detailedDescription.startsWith('http')
      ) {
        try {
          await this.minioService.deleteObject(found.detailedDescription);
        } catch (e) {
          console.error('Failed to delete old detailedDescription', e);
        }
      }
    }

    const updated = await this.prisma.project.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.shortDescription !== undefined && {
          shortDescription: dto.shortDescription,
        }),
        ...(dto.detailedDescription !== undefined && {
          detailedDescription: dto.detailedDescription,
        }),
        ...(dto.images !== undefined && { images: dto.images }),
        ...(dto.isFeatured !== undefined && { isFeatured: dto.isFeatured }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: { reviews: true },
    });
    return this.transformProject(updated);
  }

  async remove(id: string): Promise<void> {
    const found = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!found) throw new NotFoundException('Project not found');

    // Physical cleanup from MinIO
    if (this.minioService.isAvailable()) {
      // Try to delete by prefix (assuming we store in projects/{id} or projects/default/{id})
      // Since we are not strictly enforcing prefix consistency in older code, we try both or just best effort.
      // For detailedDescription, we know the key.

      if (
        found.detailedDescription &&
        !found.detailedDescription.startsWith('http')
      ) {
        try {
          await this.minioService.deleteObject(found.detailedDescription);
        } catch (error) {
          console.error(
            `Failed to cleanup detailedDescription ${found.detailedDescription}`,
            error,
          );
        }
      }

      // Clean up images folder if possible (projects/{id}/, projects/default/{id}/)
      // This is risky if unrelated files share prefix.
      // Let's skip aggressive folder deletion for project unless we are sure.
    }

    await this.prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
