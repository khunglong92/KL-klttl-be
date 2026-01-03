import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class GetPresignedUploadUrlDto {
  @ApiProperty({
    description: 'Folder path for the file (e.g., products, services, quote)',
    example: 'products/1/product-name',
  })
  @IsString()
  @IsNotEmpty()
  folder: string;

  @ApiProperty({
    description: 'Original filename',
    example: 'image.jpg',
  })
  @IsString()
  @IsNotEmpty()
  filename: string;

  @ApiProperty({
    description: 'Content type of the file',
    example: 'image/jpeg',
  })
  @IsString()
  @IsNotEmpty()
  contentType: string;

  @ApiProperty({
    description: 'Category ID (optional, for products)',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  categoryId?: number;

  @ApiProperty({
    description: 'Entity name (optional, for folder structure)',
    required: false,
  })
  @IsString()
  @IsOptional()
  entityName?: string;

  @ApiProperty({
    description: 'Product ID (optional, for products)',
    required: false,
  })
  @IsString()
  @IsOptional()
  productId?: string;

  @ApiProperty({
    description: 'Custom key (optional, use this to overwrite existing file)',
    required: false,
  })
  @IsString()
  @IsOptional()
  customKey?: string;

  @ApiProperty({
    description: 'Đánh dấu đây là file mô tả chi tiết để dùng tên file cố định',
    required: false,
  })
  @IsOptional()
  isDetailedDescription?: boolean;
}

export class GetPresignedUploadUrlResponseDto {
  @ApiProperty({ description: 'Presigned URL for uploading' })
  uploadUrl: string;

  @ApiProperty({ description: 'Object key to store (save this to database)' })
  key: string;
}

export class GetFileUrlDto {
  @ApiProperty({
    description: 'Object key stored in database',
    example: 'products/1/product-name/abc123.jpg',
  })
  @IsString()
  @IsNotEmpty()
  key: string;
}

export class GetFileUrlResponseDto {
  @ApiProperty({ description: 'Presigned download URL' })
  url: string;
}

export class GetMultipleFileUrlsDto {
  @ApiProperty({
    description: 'Array of object keys',
    example: ['products/1/image1.jpg', 'products/1/image2.jpg'],
  })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  keys: string[];
}

export class GetMultipleFileUrlsResponseDto {
  @ApiProperty({
    description: 'Object mapping keys to presigned URLs',
  })
  urls: Record<string, string>;
}
