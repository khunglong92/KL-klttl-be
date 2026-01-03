import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateProductCategoryDto) {
    return this.prisma.productCategory.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        sampleProducts: (dto.sampleProducts ??
          null) as unknown as Prisma.InputJsonValue,
        contactPhone: dto.contactPhone,
        contactZalo: dto.contactZalo,
        isActive: dto.isActive ?? true,
      },
    });
  }

  findAll() {
    return this.prisma.productCategory.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const found = await this.prisma.productCategory.findFirst({
      where: { id, deletedAt: null },
    });
    if (!found) throw new NotFoundException('Product category not found');
    return found;
  }

  async update(id: string, dto: UpdateProductCategoryDto) {
    await this.findOne(id); // Check if exists

    const sampleProducts =
      dto.sampleProducts !== undefined
        ? (dto.sampleProducts
            ?.filter(
              (p) => !!p && typeof p.name === 'string' && p.name.length > 0,
            )
            .map((p) => ({
              name: p.name as string,
              image: p.image,
              description: p.description,
            })) ?? null)
        : undefined;

    return this.prisma.productCategory.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(sampleProducts !== undefined && {
          sampleProducts: sampleProducts as Prisma.InputJsonValue,
        }),
        ...(dto.contactPhone !== undefined && {
          contactPhone: dto.contactPhone,
        }),
        ...(dto.contactZalo !== undefined && { contactZalo: dto.contactZalo }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id); // Check if exists
    await this.prisma.productCategory.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
