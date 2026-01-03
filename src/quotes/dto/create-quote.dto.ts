import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const PHONE_REGEX = /^(0[35789])[0-9]{8}$/;

export class CreateQuoteDto {
  @ApiProperty({ description: 'Tên người gửi', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Địa chỉ email', maxLength: 255 })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiProperty({ description: 'Số điện thoại liên hệ', maxLength: 20 })
  @IsString()
  @IsNotEmpty()
  @Matches(PHONE_REGEX, { message: 'Số điện thoại không hợp lệ' })
  @MaxLength(20)
  phone: string;

  @ApiPropertyOptional({ description: 'Tên công ty', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  company?: string;

  @ApiPropertyOptional({ description: 'Địa chỉ' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Chức danh', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiProperty({ description: 'Tên dự án', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  projectName: string;

  @ApiProperty({ description: 'Loại dự án', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  projectType: string;

  @ApiProperty({ description: 'Mô tả dự án' })
  @IsString()
  @IsNotEmpty()
  projectDescription: string;

  @ApiPropertyOptional({ description: 'Ngân sách dự kiến', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  budget?: string;

  @ApiPropertyOptional({
    description: 'Thời gian hoàn thành kỳ vọng',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  expectedCompletion?: string;

  @ApiPropertyOptional({ description: 'Yêu cầu kỹ thuật' })
  @IsOptional()
  @IsString()
  technicalRequirements?: string;

  @ApiProperty({ description: 'Nội dung yêu cầu báo giá' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: 'Chủ đề yêu cầu', default: 'quote' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({
    description: 'Đường dẫn file đính kèm (nếu có)',
  })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @ApiPropertyOptional({
    description: 'Alias cho attachmentUrl (giữ tương thích với FE cũ)',
  })
  @IsOptional()
  @IsString()
  attachments?: string;
}
