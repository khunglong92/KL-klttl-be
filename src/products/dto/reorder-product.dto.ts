import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderProductItemDto {
  @ApiProperty({ example: 'uuid', description: 'ID của sản phẩm' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: 0, description: 'Thứ tự sắp xếp mới' })
  @IsInt()
  @IsNotEmpty()
  orderIndex: number;
}
