import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsBoolean,
} from 'class-validator';

export class CreateServiceDto {
  @ApiPropertyOptional({ description: 'ID dịch vụ (UUID)' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ description: 'Tên dịch vụ' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Mô tả ngắn' })
  @IsString()
  @IsNotEmpty()
  shortDescription: string;

  @ApiPropertyOptional({ description: 'Mô tả chi tiết (HTML/Minio Key)' })
  @IsString()
  @IsOptional()
  detailedDescription?: string;

  @ApiPropertyOptional({ description: 'Hashtags' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hashtags?: string[];

  @ApiPropertyOptional({ description: 'Danh sách ảnh' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({ description: 'Dịch vụ nổi bật', default: false })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;
}
