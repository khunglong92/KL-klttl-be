import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
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

  @ApiPropertyOptional({
    description:
      'Thứ tự thử fallback khi provider khác lỗi (0 = thử trước). Mặc định xếp cuối hàng.',
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  priority?: number;
}
