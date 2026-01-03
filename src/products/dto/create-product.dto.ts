import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ReviewDto {
  @ApiProperty({ description: 'Email người đánh giá' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Tên người đánh giá' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Nội dung bình luận' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: 'Số sao đánh giá (1-5)', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;
}

export class CreateProductDto {
  @ApiPropertyOptional({
    description:
      'ID sản phẩm (UUID). Nếu không cung cấp, hệ thống sẽ tự động tạo.',
    format: 'uuid',
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ description: 'Tên sản phẩm' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Giá sản phẩm (VND)', type: String })
  @IsOptional()
  @IsString()
  price?: string;

  @ApiPropertyOptional({
    description: 'Danh sách hình ảnh URL/Key',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({
    description: 'Danh sách mô tả ngắn',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  description?: string[];

  @ApiPropertyOptional({
    description: 'Mô tả chi tiết (Minio Key)',
    type: String,
  })
  @IsOptional()
  @IsString()
  detailedDescription?: string;

  @ApiProperty({ description: 'ID danh mục' })
  @IsInt()
  @Min(1)
  categoryId: number;

  @ApiPropertyOptional({ description: 'Sản phẩm nổi bật', default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Cho phép hiển thị giá', default: true })
  @IsOptional()
  @IsBoolean()
  showPrice?: boolean;
}
