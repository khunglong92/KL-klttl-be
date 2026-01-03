import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : String(value ?? '').trim(),
  )
  email: string;

  @ApiProperty({ example: 'yourStrongPassword' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
