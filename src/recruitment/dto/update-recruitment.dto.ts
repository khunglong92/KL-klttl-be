import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateRecruitmentDto } from './create-recruitment.dto';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateRecruitmentDto extends PartialType(CreateRecruitmentDto) {
  @ApiPropertyOptional({
    description: 'Danh sách các ảnh cần xóa (public_id)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deletedImages?: string[];
}
