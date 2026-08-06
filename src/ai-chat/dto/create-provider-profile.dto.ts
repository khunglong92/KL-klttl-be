import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateProviderProfileDto {
  @ApiProperty({ description: 'Tên gợi nhớ cho cấu hình (VD: OpenAI chính)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Nhà cung cấp (openai, nvidia, openrouter, groq, custom)',
    default: 'custom',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  provider?: string;

  @ApiProperty({ description: 'Base URL kiểu OpenAI-compatible' })
  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_tld: false })
  baseUrl: string;

  @ApiPropertyOptional({ description: 'API Key (chỉ gửi khi tạo/đổi key)' })
  @IsString()
  @IsOptional()
  apiKey?: string;

  @ApiProperty({ description: 'Tên model (VD: gpt-4o-mini)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  model: string;
}
