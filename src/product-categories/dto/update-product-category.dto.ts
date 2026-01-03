import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

class UpdateSampleProductDto {
  @ApiPropertyOptional({ description: 'Tên sản phẩm mẫu' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Ảnh sản phẩm mẫu (URL)' })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiPropertyOptional({ description: 'Mô tả ngắn' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateProductCategoryDto {
  @ApiPropertyOptional({ description: 'Tên danh mục' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Slug duy nhất' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  slug?: string;

  @ApiPropertyOptional({ description: 'Mô tả' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Danh sách sản phẩm mẫu',
    type: [UpdateSampleProductDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSampleProductDto)
  sampleProducts?: UpdateSampleProductDto[];

  @ApiPropertyOptional({ description: 'Số điện thoại liên hệ' })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiPropertyOptional({ description: 'Zalo liên hệ' })
  @IsString()
  @IsOptional()
  contactZalo?: string;

  @ApiPropertyOptional({ description: 'Kích hoạt' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
