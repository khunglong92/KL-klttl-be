import { Injectable, NotFoundException } from '@nestjs/common';
import { CompanyIntro } from '@prisma/client';

import { CreateCompanyIntroDto } from './dto/create-company-intro.dto';
import { UpdateCompanyIntroDto } from './dto/update-company-intro.dto';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../minio/minio.service';

@Injectable()
export class CompanyIntroService {
  constructor(
    private prisma: PrismaService,
    private readonly minioService: MinioService,
  ) {}

  /**
   * Transform company intro to include presigned URL
   * Similar to products.service.ts transformProduct method
   */
  private async transformCompanyIntro(
    intro: CompanyIntro,
  ): Promise<CompanyIntro>;
  private async transformCompanyIntro(
    intro: CompanyIntro | null,
  ): Promise<CompanyIntro | null>;
  private async transformCompanyIntro(
    intro: CompanyIntro | null,
  ): Promise<CompanyIntro | null> {
    if (!intro) return null;
    const transformed = { ...intro };

    // Convert key to presigned URL
    if (transformed.url) {
      const key = transformed.url;
      if (key.startsWith('http')) {
        // Already a URL (legacy data), keep as-is
      } else if (this.minioService.isAvailable()) {
        // Convert key to presigned download URL
        transformed.url = await this.minioService.getPresignedDownloadUrl(key);
      }
    }

    return transformed;
  }

  async create(dto: CreateCompanyIntroDto): Promise<CompanyIntro> {
    const saved = await this.prisma.companyIntro.create({
      data: dto,
    });
    return this.transformCompanyIntro(saved);
  }

  async findAllActive(): Promise<CompanyIntro[]> {
    const data = await this.prisma.companyIntro.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      orderBy: {
        orderIndex: 'asc',
      },
    });

    return Promise.all(data.map((item) => this.transformCompanyIntro(item)));
  }

  async findAllAdmin(): Promise<CompanyIntro[]> {
    const data = await this.prisma.companyIntro.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return Promise.all(data.map((item) => this.transformCompanyIntro(item)));
  }

  async findOne(id: string): Promise<CompanyIntro> {
    const intro = await this.prisma.companyIntro.findFirst({
      where: { id, deletedAt: null },
    });

    if (!intro) {
      throw new NotFoundException('Company intro not found');
    }

    return this.transformCompanyIntro(intro);
  }

  async update(id: string, dto: UpdateCompanyIntroDto): Promise<CompanyIntro> {
    // Check existence first (without transform)
    const existing = await this.prisma.companyIntro.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Company intro not found');
    }

    // Check if URL (image) is being updated
    if (dto.url && dto.url !== existing.url) {
      if (!existing.url.startsWith('http')) {
        try {
          // Delete old image from MinIO
          await this.minioService.deleteObject(existing.url);
        } catch (error) {
          console.error(`Failed to delete old image: ${existing.url}`, error);
          // Continue with update even if delete fails
        }
      }
    }

    const updated = await this.prisma.companyIntro.update({
      where: { id },
      data: dto,
    });

    return this.transformCompanyIntro(updated);
  }

  async softDelete(id: string): Promise<CompanyIntro> {
    // Check existence first
    const existing = await this.prisma.companyIntro.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Company intro not found');
    }

    if (existing.url && !existing.url.startsWith('http')) {
      try {
        await this.minioService.deleteObject(existing.url);
      } catch (error) {
        console.error(`Failed to delete image: ${existing.url}`, error);
      }
    }

    return this.prisma.companyIntro.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async toggleActive(id: string, isActive: boolean): Promise<CompanyIntro> {
    const updated = await this.prisma.companyIntro.update({
      where: { id },
      data: { isActive },
    });
    return this.transformCompanyIntro(updated);
  }

  async updateOrder(id: string, orderIndex: number): Promise<CompanyIntro> {
    const updated = await this.prisma.companyIntro.update({
      where: { id },
      data: { orderIndex },
    });
    return this.transformCompanyIntro(updated);
  }
}
