import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ description: 'ID phiên chat (do trình duyệt tạo ngẫu nhiên)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  sessionId: string;

  @ApiProperty({ description: 'Nội dung câu hỏi của người dùng' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  message: string;
}
