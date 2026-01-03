import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token nhận được khi đăng nhập' })
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}
