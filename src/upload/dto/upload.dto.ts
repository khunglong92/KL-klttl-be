import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export enum UploadFolder {
  PRODUCTS = 'products',
  CATEGORIES = 'categories',
  GENERAL = 'general',
  SERVICES = 'services',
}

export class UploadDto {
  @ApiPropertyOptional({
    description:
      'Folder to save the image in (e.g., products, services, categories, or any custom folder name)',
    example: 'products',
  })
  @IsString()
  @IsOptional()
  folder?: string;

  @ApiPropertyOptional({
    description: 'Product ID (optional, for stable folder structure)',
    required: false,
  })
  @IsString()
  @IsOptional()
  productId?: string;
}
