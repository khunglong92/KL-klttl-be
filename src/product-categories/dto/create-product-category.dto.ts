import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

class SampleProductDto {
  @ApiProperty({ description: 'Tên sản phẩm mẫu' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Ảnh sản phẩm mẫu (URL)' })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiPropertyOptional({ description: 'Mô tả ngắn' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateProductCategoryDto {
  @ApiProperty({ description: 'Tên danh mục' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Slug duy nhất' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  slug: string;

  @ApiPropertyOptional({ description: 'Mô tả' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Danh sách sản phẩm mẫu',
    type: [SampleProductDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SampleProductDto)
  sampleProducts?: SampleProductDto[];

  @ApiPropertyOptional({ description: 'Số điện thoại liên hệ' })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiPropertyOptional({ description: 'Zalo liên hệ' })
  @IsString()
  @IsOptional()
  contactZalo?: string;

  @ApiPropertyOptional({ description: 'Kích hoạt', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
