import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProviderProfileDto } from './dto/create-provider-profile.dto';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import {
  decryptApiKey,
  encryptApiKey,
  maskApiKey,
} from './ai-chat-crypto.util';
import type { AiProviderProfile } from '@prisma/client';

export interface ProviderProfilePublic {
  id: string;
  name: string;
  provider: string;
  baseUrl: string;
  apiKeyMasked: string;
  hasApiKey: boolean;
  model: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string | null;
}

@Injectable()
export class AiProviderProfileService {
  constructor(private readonly prisma: PrismaService) {}

  private toPublic(row: AiProviderProfile): ProviderProfilePublic {
    let apiKeyMasked = '';
    let hasApiKey = false;
    if (row.apiKeyEnc) {
      try {
        apiKeyMasked = maskApiKey(decryptApiKey(row.apiKeyEnc));
        hasApiKey = true;
      } catch {
        apiKeyMasked = '';
        hasApiKey = false;
      }
    }

    return {
      id: row.id,
      name: row.name,
      provider: row.provider,
      baseUrl: row.baseUrl,
      apiKeyMasked,
      hasApiKey,
      model: row.model,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      updatedBy: row.updatedBy,
    };
  }

  async list(): Promise<ProviderProfilePublic[]> {
    const rows = await this.prisma.aiProviderProfile.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => this.toPublic(row));
  }

  async create(
    dto: CreateProviderProfileDto,
    updatedBy?: string,
  ): Promise<ProviderProfilePublic> {
    const existingCount = await this.prisma.aiProviderProfile.count();
    const row = await this.prisma.aiProviderProfile.create({
      data: {
        name: dto.name,
        provider: dto.provider ?? 'custom',
        baseUrl: dto.baseUrl,
        apiKeyEnc: dto.apiKey ? encryptApiKey(dto.apiKey) : null,
        model: dto.model,
        // First profile created is auto-activated.
        isActive: existingCount === 0,
        updatedBy,
      },
    });
    return this.toPublic(row);
  }

  async update(
    id: string,
    dto: UpdateProviderProfileDto,
    updatedBy?: string,
  ): Promise<ProviderProfilePublic> {
    await this.findOrThrow(id);
    const row = await this.prisma.aiProviderProfile.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.provider !== undefined && { provider: dto.provider }),
        ...(dto.baseUrl !== undefined && { baseUrl: dto.baseUrl }),
        ...(dto.model !== undefined && { model: dto.model }),
        ...(dto.apiKey !== undefined &&
          dto.apiKey !== '' && { apiKeyEnc: encryptApiKey(dto.apiKey) }),
        updatedBy,
      },
    });
    return this.toPublic(row);
  }

  async delete(id: string): Promise<void> {
    await this.findOrThrow(id);
    await this.prisma.aiProviderProfile.delete({ where: { id } });
  }

  async activate(id: string): Promise<ProviderProfilePublic> {
    await this.findOrThrow(id);
    const [, row] = await this.prisma.$transaction([
      this.prisma.aiProviderProfile.updateMany({
        where: { NOT: { id } },
        data: { isActive: false },
      }),
      this.prisma.aiProviderProfile.update({
        where: { id },
        data: { isActive: true },
      }),
    ]);
    return this.toPublic(row);
  }

  async getActiveDecryptedForRuntime(): Promise<{
    baseUrl: string;
    apiKey: string | null;
    model: string;
  } | null> {
    const row = await this.prisma.aiProviderProfile.findFirst({
      where: { isActive: true },
    });
    if (!row) return null;
    return {
      baseUrl: row.baseUrl,
      apiKey: row.apiKeyEnc ? this.safeDecrypt(row.apiKeyEnc) : null,
      model: row.model,
    };
  }

  async getDecryptedById(
    id: string,
  ): Promise<{ baseUrl: string; apiKey: string | null; model: string }> {
    const row = await this.findOrThrow(id);
    return {
      baseUrl: row.baseUrl,
      apiKey: row.apiKeyEnc ? this.safeDecrypt(row.apiKeyEnc) : null,
      model: row.model,
    };
  }

  private safeDecrypt(payload: string): string | null {
    try {
      return decryptApiKey(payload);
    } catch {
      return null;
    }
  }

  private async findOrThrow(id: string): Promise<AiProviderProfile> {
    const row = await this.prisma.aiProviderProfile.findUnique({
      where: { id },
    });
    if (!row) {
      throw new NotFoundException('Không tìm thấy cấu hình nhà cung cấp AI');
    }
    return row;
  }
}
