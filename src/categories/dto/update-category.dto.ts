import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateCategoryDto {
  @ApiPropertyOptional({ description: 'Tên danh mục' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Mô tả danh mục' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'ID người cập nhật' })
  @IsOptional()
  @IsInt()
  @Min(1)
  updatedByUserId?: number;

  @ApiPropertyOptional({ description: 'Tên người cập nhật' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  updatedByName?: string;
}
