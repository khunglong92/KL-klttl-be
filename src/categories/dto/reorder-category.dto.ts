import { IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderCategoryItemDto {
  @ApiProperty({ example: 1, description: 'ID của danh mục' })
  @IsInt()
  @IsNotEmpty()
  id: number;

  @ApiProperty({ example: 0, description: 'Thứ tự sắp xếp mới' })
  @IsInt()
  @IsNotEmpty()
  orderIndex: number;
}
