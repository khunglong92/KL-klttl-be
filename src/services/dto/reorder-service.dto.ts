import { IsInt, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderServiceItemDto {
  @ApiProperty({ example: 'uuid', description: 'ID của dịch vụ' })
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: 0, description: 'Thứ tự sắp xếp mới' })
  @IsInt()
  @IsNotEmpty()
  orderIndex: number;
}
