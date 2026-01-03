import { ApiProperty } from '@nestjs/swagger';
import { ReviewTargetType } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ description: 'Tên người đánh giá' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Email người đánh giá' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Nội dung đánh giá' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: 'Số sao đánh giá (1-5)', default: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  rating: number;

  @ApiProperty({
    enum: ReviewTargetType,
    description:
      'Loại thực thể được đánh giá (PRODUCT, PROJECT, SERVICE, OTHER)',
  })
  @IsEnum(ReviewTargetType)
  @IsNotEmpty()
  targetType: ReviewTargetType;

  @ApiProperty({ description: 'ID của thực thể được đánh giá' })
  @IsString()
  @IsNotEmpty()
  targetId: string;
}
