import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateQuoteDto {
  @ApiProperty({ description: 'Trạng thái xác nhận của yêu cầu' })
  @IsBoolean()
  @IsNotEmpty()
  isConfirmed: boolean;
}
