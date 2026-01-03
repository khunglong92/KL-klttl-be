import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreatePriceQuoteDto } from './create-price-quote.dto';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdatePriceQuoteDto extends PartialType(CreatePriceQuoteDto) {
  @ApiPropertyOptional({
    description: 'Danh sách các ảnh cần xóa (public_id)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deletedImages?: string[];
}
