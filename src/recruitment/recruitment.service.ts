import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../minio/minio.service';
import { CreateRecruitmentDto } from './dto/create-recruitment.dto';
import { UpdateRecruitmentDto } from './dto/update-recruitment.dto';

interface ContentSection {
  title: string;
  description: string;
  image?: string;
}

interface RecruitmentRecord {
  id: string;
  title: string;
  subtitle: string | null;
  image: string | null;
  contentSections: unknown;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

@Injectable()
export class RecruitmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minioService: MinioService,
  ) {}

  private async transformRecruitment(recruitment?: RecruitmentRecord) {
    if (!recruitment) return undefined;
    const transformed: Record<string, unknown> = { ...recruitment };

    // Transform image URL
    if (recruitment.image) {
      transformed.image = await this.minioService.getPresignedDownloadUrl(
        recruitment.image,
      );
    }

    // Transform content section images
    if (
      recruitment.contentSections &&
      Array.isArray(recruitment.contentSections)
    ) {
      const sections = await Promise.all(
        (recruitment.contentSections as ContentSection[]).map(
          async (section) => {
            if (section.image) {
              return {
                ...section,
                image: await this.minioService.getPresignedDownloadUrl(
                  section.image,
                ),
              };
            }
            return section;
          },
        ),
      );
      transformed.contentSections = sections;
    }

    return transformed;
  }

  async create(dto: CreateRecruitmentDto) {
    const recruitment = await this.prisma.recruitment.create({
      data: {
        id: dto.id, // Use ID from DTO if provided
        title: dto.title,
        subtitle: dto.subtitle,
        image: dto.image,
        contentSections: (dto.contentSections || []) as unknown as any,
        isFeatured: dto.isFeatured ?? false,
        isActive: dto.isActive ?? true,
      },
    });
    return this.transformRecruitment(recruitment as RecruitmentRecord);
  }

  async findAll(options?: {
    search?: string;
    page?: number;
    perPage?: number;
  }) {
    const { search, page = 1, perPage = 10 } = options || {};
    const skip = (page - 1) * perPage;

    const where = {
      deletedAt: null,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { subtitle: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.recruitment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      this.prisma.recruitment.count({ where }),
    ]);

    const transformedData = await Promise.all(
      data.map((item) =>
        this.transformRecruitment(item as unknown as RecruitmentRecord),
      ),
    );

    return {
      data: transformedData,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async findFeatured(limit: number = 5) {
    const data = await this.prisma.recruitment.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        isFeatured: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const result = await Promise.all(
      data.map((item) =>
        this.transformRecruitment(item as unknown as RecruitmentRecord),
      ),
    );
    return result;
  }

  async findOne(id: string) {
    const recruitment = await this.prisma.recruitment.findFirst({
      where: { id, deletedAt: null },
    });
    if (!recruitment) throw new NotFoundException('Recruitment not found');
    return this.transformRecruitment(recruitment as RecruitmentRecord);
  }

  async update(id: string, dto: UpdateRecruitmentDto) {
    await this.findOne(id);

    // Handle deleted images
    if (dto.deletedImages && dto.deletedImages.length > 0) {
      // Process deletions in background or await if critical
      // Using Promise.allSettled to ensure partial failures don't block
      await Promise.allSettled(
        dto.deletedImages.map((publicId) =>
          this.minioService.deleteObject(publicId),
        ),
      );
    }

    const recruitment = await this.prisma.recruitment.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.subtitle !== undefined && { subtitle: dto.subtitle }),
        ...(dto.image !== undefined && { image: dto.image }),
        ...(dto.contentSections !== undefined && {
          contentSections: dto.contentSections as unknown as any,
        }),
        ...(dto.isFeatured !== undefined && { isFeatured: dto.isFeatured }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
    return this.transformRecruitment(recruitment as RecruitmentRecord);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);

    if (this.minioService.isAvailable()) {
      await this.minioService
        .deleteObjectsByPrefix(`recruitment/${id}/`)
        .catch((e) =>
          console.error(`Failed to delete recruitment folder ${id}`, e),
        );
    }

    await this.prisma.recruitment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Clean up folder if necessary - but since we do soft delete,
    // we generally keep files until hard delete.
    // However, if requested to hard cleanup, we can enable this:
    // await this.minioService.deleteFolder(`recruitment/${id}`);
  }
}
