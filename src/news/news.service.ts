import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../minio/minio.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';

interface ContentSection {
  title: string;
  description: string;
  image?: string;
}

interface NewsRecord {
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
export class NewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minioService: MinioService,
  ) {}

  private async transformNews(news?: NewsRecord) {
    if (!news) return undefined;
    const transformed: Record<string, unknown> = { ...news };

    // Transform image URL
    if (news.image) {
      transformed.image = await this.minioService.getPresignedDownloadUrl(
        news.image,
      );
    }

    // Transform content section images
    if (news.contentSections && Array.isArray(news.contentSections)) {
      const sections = await Promise.all(
        (news.contentSections as ContentSection[]).map(async (section) => {
          if (section.image) {
            return {
              ...section,
              image: await this.minioService.getPresignedDownloadUrl(
                section.image,
              ),
            };
          }
          return section;
        }),
      );
      transformed.contentSections = sections;
    }

    return transformed;
  }

  async create(dto: CreateNewsDto) {
    const news = await this.prisma.news.create({
      data: {
        ...(dto.id && { id: dto.id }),
        title: dto.title,
        subtitle: dto.subtitle,
        image: dto.image,
        contentSections: (dto.contentSections || []) as unknown as any,
        isFeatured: dto.isFeatured ?? false,
        isActive: dto.isActive ?? true,
      },
    });
    return this.transformNews(news as NewsRecord);
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
      this.prisma.news.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      this.prisma.news.count({ where }),
    ]);

    const transformedData = await Promise.all(
      data.map((item: NewsRecord) => this.transformNews(item)),
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
    const data = await this.prisma.news.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        isFeatured: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return Promise.all(
      data.map((item: NewsRecord) => this.transformNews(item)),
    );
  }

  async findOne(id: string) {
    const news = await this.prisma.news.findFirst({
      where: { id, deletedAt: null },
    });
    if (!news) throw new NotFoundException('News not found');
    return this.transformNews(news as NewsRecord);
  }

  async update(id: string, dto: UpdateNewsDto) {
    await this.findOne(id);

    // Handle deleted images
    if (this.minioService.isAvailable()) {
      if (dto.deletedImages && dto.deletedImages.length > 0) {
        await Promise.all(
          dto.deletedImages.map((img) =>
            this.minioService.deleteObject(img).catch((e) => {
              console.error(`Failed to delete image ${img}`, e);
            }),
          ),
        );
      }
    }

    const news = await this.prisma.news.update({
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
    return this.transformNews(news as NewsRecord);
  }

  async remove(id: string): Promise<void> {
    const found = await this.prisma.news.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('News not found');

    if (this.minioService.isAvailable()) {
      // Delete the entire news folder: news/{id}/
      await this.minioService
        .deleteObjectsByPrefix(`news/${id}/`)
        .catch((e) => console.error(`Failed to delete news folder ${id}`, e));
    }

    await this.prisma.news.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
