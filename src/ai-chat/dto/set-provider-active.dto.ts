import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetProviderActiveDto {
  @ApiProperty({
    description:
      'Bật/tắt provider này trong pool fallback (nhiều provider có thể cùng bật)',
  })
  @IsBoolean()
  isActive: boolean;
}
