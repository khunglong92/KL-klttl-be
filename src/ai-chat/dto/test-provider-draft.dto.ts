import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class TestProviderDraftDto {
  @ApiProperty({ description: 'Base URL kiểu OpenAI-compatible' })
  @IsString()
  @IsNotEmpty()
  baseUrl: string;

  @ApiPropertyOptional({ description: 'API Key để thử kết nối' })
  @IsString()
  @IsOptional()
  apiKey?: string;

  @ApiProperty({ description: 'Tên model' })
  @IsString()
  @IsNotEmpty()
  model: string;
}
