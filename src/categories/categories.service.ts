import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateCategoryDto) {
    return await this.prisma.category.create({
      data: createDto,
    });
  }

  async findAll() {
    return await this.prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: { orderIndex: 'asc' },
    });
  }

  async findOne(id: number) {
    const found = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
    });
    if (!found) {
      throw new NotFoundException('Category not found');
    }
    return found;
  }

  async update(id: number, updateDto: UpdateCategoryDto) {
    await this.findOne(id); // Check if exists
    return await this.prisma.category.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id); // Check if exists
    await this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async reorder(items: { id: number; orderIndex: number }[]) {
    // Transaction to update all items
    return await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.category.update({
          where: { id: item.id },
          data: { orderIndex: item.orderIndex },
        }),
      ),
    );
  }
}
