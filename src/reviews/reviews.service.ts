import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewTargetType, Review } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createReviewDto: CreateReviewDto): Promise<Review> {
    return await this.prisma.review.create({
      data: {
        name: createReviewDto.name,
        email: createReviewDto.email,
        content: createReviewDto.content,
        rating: createReviewDto.rating,
        targetType: createReviewDto.targetType,
        targetId: createReviewDto.targetId,
      },
    });
  }

  async findAll(
    page = 1,
    limit = 10,
    targetType?: ReviewTargetType,
    targetId?: string,
  ): Promise<{ data: Review[]; total: number; page: number; limit: number }> {
    const where = {
      ...(targetType && { targetType }),
      ...(targetId && { targetId }),
    };

    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Review> {
    const found = await this.prisma.review.findUnique({
      where: { id },
    });
    if (!found) {
      throw new NotFoundException('Review not found');
    }
    return found;
  }

  async remove(id: string): Promise<Review> {
    await this.findOne(id);
    return await this.prisma.review.delete({
      where: { id },
    });
  }
}
