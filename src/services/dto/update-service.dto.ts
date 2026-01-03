import { PartialType } from '@nestjs/swagger';
import { CreateServiceDto } from './create-service.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateServiceDto extends PartialType(CreateServiceDto) {
  @ApiPropertyOptional({ description: 'Danh sách ảnh bị xóa (Minio Keys)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deletedImages?: string[];
}
