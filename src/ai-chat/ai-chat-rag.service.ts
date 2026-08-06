import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContactInfoService } from '../contact-info/contact-info.service';
import { ServiceStatus } from '@prisma/client';

const STOPWORDS = new Set([
  // Vietnamese (diacritics-stripped)
  'la',
  'va',
  'cua',
  'nao',
  'co',
  'khong',
  'toi',
  'ban',
  'voi',
  'cho',
  'nay',
  'do',
  'giup',
  'nhieu',
  // English
  'a',
  'an',
  'the',
  'is',
  'are',
  'of',
  'for',
  'and',
  'to',
  'in',
  'what',
  'how',
  'much',
  'do',
  'you',
  'i',
]);

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ');
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function scoreText(queryTokens: string[], text: string): number {
  const targetTokens = new Set(tokenize(text));
  let score = 0;
  for (const token of queryTokens) {
    if (targetTokens.has(token)) score += 1;
  }
  return score;
}

@Injectable()
export class AiChatRagService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contactInfoService: ContactInfoService,
  ) {}

  async buildContext(question: string): Promise<string> {
    const queryTokens = tokenize(question);

    const [products, services, contactInfo] = await Promise.all([
      this.prisma.product.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          price: true,
          description: true,
          showPrice: true,
        },
      }),
      this.prisma.service.findMany({
        where: { deletedAt: null, status: ServiceStatus.published },
        select: {
          id: true,
          name: true,
          shortDescription: true,
          hashtags: true,
        },
      }),
      this.contactInfoService.getContactInfo(),
    ]);

    const sections: string[] = [];

    const topProducts = products
      .map((p) => ({
        item: p,
        score: scoreText(queryTokens, `${p.name} ${p.description.join(' ')}`),
      }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    if (topProducts.length > 0) {
      const lines = topProducts.map(({ item }) => {
        const url = `/products/${item.id}`;
        const priceText = item.showPrice && item.price ? item.price : 'Liên hệ';
        const desc = item.description.join('. ') || 'Không có mô tả';
        return `- [Sản phẩm](${url}) "${item.name}": ${desc}. Giá: ${priceText}. Link: ${url}`;
      });
      sections.push(`THÔNG TIN SẢN PHẨM LIÊN QUAN:\n${lines.join('\n')}`);
    }

    const topServices = services
      .map((s) => ({
        item: s,
        score: scoreText(
          queryTokens,
          `${s.name} ${s.shortDescription} ${s.hashtags.join(' ')}`,
        ),
      }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    if (topServices.length > 0) {
      const lines = topServices.map(({ item }) => {
        const url = `/services/${item.id}`;
        return `- [Dịch vụ](${url}) "${item.name}": ${item.shortDescription}. Link: ${url}`;
      });
      sections.push(`THÔNG TIN DỊCH VỤ LIÊN QUAN:\n${lines.join('\n')}`);
    }

    sections.push(
      `THÔNG TIN CÔNG TY:\n` +
        `- Tên: ${contactInfo?.companyName ?? 'đang cập nhật'}\n` +
        `- Giới thiệu: ${contactInfo?.aboutUs ?? 'đang cập nhật'}\n` +
        `- Tầm nhìn: ${contactInfo?.vision ?? 'đang cập nhật'}\n` +
        `- Sứ mệnh: ${contactInfo?.mission ?? 'đang cập nhật'}`,
    );

    sections.push(
      `THÔNG TIN LIÊN HỆ:\n` +
        `- Điện thoại: ${contactInfo?.phone ?? 'đang cập nhật'}\n` +
        `- Email: ${contactInfo?.email ?? 'đang cập nhật'}\n` +
        `- Địa chỉ: ${contactInfo?.address ?? 'đang cập nhật'}\n` +
        `- Giờ làm việc: ${contactInfo?.workingHours ?? 'đang cập nhật'}`,
    );

    return sections.join('\n\n');
  }
}
