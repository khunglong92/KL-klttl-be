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

export class RecruitmentContentSectionDto {
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

export class CreateRecruitmentDto {
  @ApiPropertyOptional({ description: 'ID của tin tuyển dụng (UUID)' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({ description: 'Tiêu đề tin tuyển dụng' })
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
    type: [RecruitmentContentSectionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecruitmentContentSectionDto)
  @IsOptional()
  contentSections?: RecruitmentContentSectionDto[];

  @ApiPropertyOptional({ description: 'Tin nổi bật', default: false })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Kích hoạt', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
