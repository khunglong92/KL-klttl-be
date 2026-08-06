import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateChatSettingsDto {
  @ApiPropertyOptional({ description: 'System prompt cho trợ lý AI' })
  @IsString()
  @IsOptional()
  @MaxLength(8000)
  systemPrompt?: string;

  @ApiPropertyOptional({ description: 'Độ sáng tạo của mô hình (0 - 2)' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiPropertyOptional({ description: 'Bật/tắt chatbot trên trang public' })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;
}
