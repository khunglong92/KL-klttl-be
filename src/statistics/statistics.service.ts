import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      products,
      services,
      projects,
      news,
      recruitments,
      priceQuotes,
      quotes,
      contacts,
      users,
    ] = await this.prisma.$transaction([
      this.prisma.product.count({ where: { deletedAt: null } }),
      this.prisma.service.count({ where: { deletedAt: null } }),
      this.prisma.project.count({ where: { deletedAt: null } }),
      this.prisma.news.count({ where: { deletedAt: null } }),
      this.prisma.recruitment.count({ where: { deletedAt: null } }),
      this.prisma.priceQuote.count({ where: { deletedAt: null } }),
      this.prisma.quote.count({ where: { deletedAt: null } }),
      this.prisma.contact.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null } }),
    ]);

    return {
      products,
      services,
      projects,
      news,
      recruitments,
      priceQuotes,
      quotes,
      contacts,
      users,
    };
  }

  async getGrowthStats() {
    // Get stats for the last 6 months
    const months = 6;
    const today = new Date();
    const result = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const nextDate = new Date(
        today.getFullYear(),
        today.getMonth() - i + 1,
        1,
      );
      const monthLabel = `T${date.getMonth() + 1}`;

      const [quotesCount, contactsCount] = await Promise.all([
        this.prisma.quote.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate,
            },
            deletedAt: null,
          },
        }),
        this.prisma.contact.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate,
            },
            deletedAt: null,
          },
        }),
      ]);

      result.push({
        month: monthLabel,
        quotes: quotesCount,
        contacts: contactsCount,
      });
    }

    return result;
  }

  async getCategoryStats() {
    // Group products by category
    const categories = await this.prisma.category.findMany({
      where: { deletedAt: null },
      include: {
        _count: {
          select: { products: { where: { deletedAt: null } } },
        },
      },
    });

    const COLORS = [
      '#3b82f6',
      '#a855f7',
      '#f59e0b',
      '#10b981',
      '#6b7280',
      '#ef4444',
      '#ec4899',
    ];

    return categories.map((cat, index) => ({
      name: cat.name,
      value: cat._count.products,
      color: COLORS[index % COLORS.length],
    }));
  }
}
