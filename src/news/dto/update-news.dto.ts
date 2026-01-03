import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { CreateNewsDto } from './create-news.dto';

export class UpdateNewsDto extends PartialType(CreateNewsDto) {
  @ApiPropertyOptional({ description: 'Danh sách ảnh cần xóa' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  deletedImages?: string[];
}
