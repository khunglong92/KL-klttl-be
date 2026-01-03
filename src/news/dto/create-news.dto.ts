import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ContentSectionDto {
  @ApiProperty({ description: 'Tiêu đề section' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Mô tả section' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'Hình ảnh minh họa (optional)' })
  @IsString()
  @IsOptional()
  image?: string;
}

export class CreateNewsDto {
  @ApiProperty({ description: 'Tiêu đề bài viết' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: 'Tiêu đề phụ' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  subtitle?: string;

  @ApiPropertyOptional({ description: 'Ảnh bìa' })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiPropertyOptional({
    description: 'Nội dung chi tiết',
    type: [ContentSectionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContentSectionDto)
  @IsOptional()
  contentSections?: ContentSectionDto[];

  @ApiPropertyOptional({ description: 'Tin nổi bật', default: false })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Kích hoạt', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'ID' })
  @IsString()
  @IsOptional()
  id?: string;
}
