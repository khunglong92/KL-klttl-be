import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateContactDto {
  @ApiProperty({ description: 'Trạng thái đã xác nhận' })
  @IsBoolean()
  @IsNotEmpty()
  isConfirmed: boolean;
}
