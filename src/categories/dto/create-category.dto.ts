import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Tên danh mục',
    example: 'Gia công và sản xuất kim loại tấm',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Mô tả danh mục', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  // slug đã được loại bỏ khỏi schema
}
