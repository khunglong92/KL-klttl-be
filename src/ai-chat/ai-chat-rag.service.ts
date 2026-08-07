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

// Điểm tối thiểu để 1 mục được coi là "khớp đủ tin cậy" và tự động gợi ý link
// nếu AI trả lời quên kèm — tránh gợi ý từ match trùng ngẫu nhiên 1-2 từ.
const MIN_CONFIDENT_SCORE = 3;

function normalize(text: string): string {
  return (
    text
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      // Chữ "đ" là ký tự riêng trong Unicode, KHÔNG bị NFD tách ra như các chữ
      // có dấu khác — nếu không map về "d" thì bị xoá luôn ở bước strip dưới,
      // làm mất tín hiệu so khớp (VD: "đẩy" sẽ còn lại "ay" thay vì "day").
      .replace(/đ/gi, 'd')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
  );
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

interface ScoredItem<T> {
  item: T;
  score: number;
}

function scoreAll<T>(
  queryTokens: string[],
  items: T[],
  buildText: (item: T) => string,
): ScoredItem<T>[] {
  return items
    .map((item) => ({ item, score: scoreText(queryTokens, buildText(item)) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
}

export interface BestMatch {
  category: string;
  label: string;
  name: string;
  url: string;
  score: number;
}

export interface RagResult {
  context: string;
  /** Mục khớp tốt nhất của MỖI danh mục (sản phẩm/dịch vụ/tin tức/tuyển dụng
   * — không chỉ 1 mục tốt nhất chung) — dùng để tự chèn link nếu AI trả lời
   * quên kèm theo hướng dẫn trong system prompt. */
  bestMatches: BestMatch[];
}

// Cấu hình chuẩn hoá cho 1 loại nội dung có thể được RAG tham chiếu tới —
// thêm loại nội dung mới (VD: dự án, khuyến mãi...) chỉ cần thêm 1 entry ở
// đây, không phải viết lại logic scoring/format/best-match riêng.
interface CategoryConfig<T> {
  category: string;
  label: string;
  sectionTitle: string;
  topN: number;
  items: T[];
  buildText: (item: T) => string;
  buildName: (item: T) => string;
  buildUrl: (item: T) => string;
  buildLine: (item: T, url: string) => string;
}

function defineCategory<T>(config: CategoryConfig<T>): CategoryConfig<unknown> {
  return config as CategoryConfig<unknown>;
}

@Injectable()
export class AiChatRagService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contactInfoService: ContactInfoService,
  ) {}

  async buildContext(question: string): Promise<RagResult> {
    const queryTokens = tokenize(question);

    const [products, services, news, recruitments, contactInfo] =
      await Promise.all([
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
        this.prisma.news.findMany({
          where: { deletedAt: null, isActive: true },
          select: { id: true, title: true, subtitle: true },
        }),
        this.prisma.recruitment.findMany({
          where: { deletedAt: null, isActive: true },
          select: { id: true, title: true, subtitle: true },
        }),
        this.contactInfoService.getContactInfo(),
      ]);

    const categories: CategoryConfig<unknown>[] = [
      defineCategory({
        category: 'product',
        label: 'Sản phẩm',
        sectionTitle: 'THÔNG TIN SẢN PHẨM LIÊN QUAN',
        topN: 3,
        items: products,
        buildText: (p) => `${p.name} ${p.description.join(' ')}`,
        buildName: (p) => p.name,
        buildUrl: (p) => `/products/${p.id}`,
        buildLine: (p, url) => {
          const priceText = p.showPrice && p.price ? p.price : 'Liên hệ';
          const desc = p.description.join('. ') || 'Không có mô tả';
          return `- [Sản phẩm](${url}) "${p.name}": ${desc}. Giá: ${priceText}. Link: ${url}`;
        },
      }),
      defineCategory({
        category: 'service',
        label: 'Dịch vụ',
        sectionTitle: 'THÔNG TIN DỊCH VỤ LIÊN QUAN',
        topN: 3,
        items: services,
        buildText: (s) =>
          `${s.name} ${s.shortDescription} ${s.hashtags.join(' ')}`,
        buildName: (s) => s.name,
        buildUrl: (s) => `/services/${s.id}`,
        buildLine: (s, url) =>
          `- [Dịch vụ](${url}) "${s.name}": ${s.shortDescription}. Link: ${url}`,
      }),
      defineCategory({
        category: 'news',
        label: 'Tin tức/Danh mục',
        // Mục "Tin tức" của website này cũng được dùng để trưng bày các danh
        // mục/nhóm sản phẩm cụ thể (VD: "Xe đẩy trong sản xuất", "Kệ siêu
        // thị"...), KHÔNG chỉ là bài viết blog thông thường — nên vẫn phải
        // coi là kết quả hợp lệ khi khách hỏi về sản phẩm/danh mục.
        sectionTitle:
          'THÔNG TIN TIN TỨC / DANH MỤC SẢN PHẨM LIÊN QUAN (mục "Tin tức" của website này cũng dùng để giới thiệu các nhóm sản phẩm cụ thể, không chỉ bài viết thông thường)',
        topN: 3,
        items: news,
        buildText: (n) => `${n.title} ${n.subtitle ?? ''}`,
        buildName: (n) => n.title,
        buildUrl: (n) => `/news/${n.id}`,
        buildLine: (n, url) =>
          `- [Xem thêm](${url}) "${n.title}": ${n.subtitle ?? ''}. Link: ${url}`,
      }),
      defineCategory({
        category: 'recruitment',
        label: 'Tuyển dụng',
        sectionTitle: 'THÔNG TIN TUYỂN DỤNG LIÊN QUAN',
        topN: 2,
        items: recruitments,
        buildText: (r) => `${r.title} ${r.subtitle ?? ''}`,
        buildName: (r) => r.title,
        buildUrl: (r) => `/recruitment/${r.id}`,
        buildLine: (r, url) =>
          `- [Tuyển dụng](${url}) "${r.title}": ${r.subtitle ?? ''}. Link: ${url}`,
      }),
    ];

    const sections: string[] = [];
    const bestMatches: BestMatch[] = [];

    for (const cfg of categories) {
      const scored = scoreAll(queryTokens, cfg.items, cfg.buildText);
      if (scored.length === 0) continue;

      const lines = scored
        .slice(0, cfg.topN)
        .map(({ item }) => cfg.buildLine(item, cfg.buildUrl(item)));
      sections.push(`${cfg.sectionTitle}:\n${lines.join('\n')}`);

      const top = scored[0];
      if (top.score >= MIN_CONFIDENT_SCORE) {
        bestMatches.push({
          category: cfg.category,
          label: cfg.label,
          name: cfg.buildName(top.item),
          url: cfg.buildUrl(top.item),
          score: top.score,
        });
      }
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

    bestMatches.sort((a, b) => b.score - a.score);

    return {
      context: sections.join('\n\n'),
      bestMatches,
    };
  }
}
