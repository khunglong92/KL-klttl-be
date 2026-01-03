import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../minio/minio.service';
import { CreatePriceQuoteDto } from './dto/create-price-quote.dto';
import { UpdatePriceQuoteDto } from './dto/update-price-quote.dto';

interface ContentSection {
  title: string;
  description: string;
  image?: string;
}

interface PriceQuoteRecord {
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
export class PriceQuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minioService: MinioService,
  ) {}

  private async transformPriceQuote(quote?: PriceQuoteRecord) {
    if (!quote) return undefined;
    const transformed: Record<string, unknown> = { ...quote };

    // Transform image URL
    if (quote.image) {
      transformed.image = await this.minioService.getPresignedDownloadUrl(
        quote.image,
      );
    }

    // Transform content section images
    if (quote.contentSections && Array.isArray(quote.contentSections)) {
      const sections = await Promise.all(
        (quote.contentSections as ContentSection[]).map(async (section) => {
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

  async create(dto: CreatePriceQuoteDto) {
    const quote = await this.prisma.priceQuote.create({
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
    return this.transformPriceQuote(quote as PriceQuoteRecord);
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
      this.prisma.priceQuote.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      this.prisma.priceQuote.count({ where }),
    ]);

    const transformedData = await Promise.all(
      data.map((item: PriceQuoteRecord) => this.transformPriceQuote(item)),
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
    const data = await this.prisma.priceQuote.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        isFeatured: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return Promise.all(
      data.map((item: PriceQuoteRecord) => this.transformPriceQuote(item)),
    );
  }

  async findOne(id: string) {
    const quote = await this.prisma.priceQuote.findFirst({
      where: { id, deletedAt: null },
    });
    if (!quote) throw new NotFoundException('Price Quote not found');
    return this.transformPriceQuote(quote as PriceQuoteRecord);
  }

  async update(id: string, dto: UpdatePriceQuoteDto) {
    await this.findOne(id);

    // Handle deleted images
    if (dto.deletedImages && dto.deletedImages.length > 0) {
      console.log('--- Processing Deleted Images ---');
      console.log('Total images to delete:', dto.deletedImages.length);

      await Promise.allSettled(
        dto.deletedImages.map((publicId) =>
          this.minioService.deleteObject(publicId),
        ),
      );
    }

    const quote = await this.prisma.priceQuote.update({
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
    return this.transformPriceQuote(quote as PriceQuoteRecord);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    if (this.minioService.isAvailable()) {
      console.log(`Attempting to delete MinIO prefix: price-quotes/${id}/`);
      await this.minioService
        .deleteObjectsByPrefix(`price-quotes/${id}/`)
        .catch((e) =>
          console.error(`Failed to delete price quote folder ${id}`, e),
        );
    }

    await this.prisma.priceQuote.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
