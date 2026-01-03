import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PriceQuotesService } from './price-quotes.service';
import { CreatePriceQuoteDto } from './dto/create-price-quote.dto';
import { UpdatePriceQuoteDto } from './dto/update-price-quote.dto';

@ApiTags('Price Quotes')
@Controller('price-quotes')
export class PriceQuotesController {
  constructor(private readonly service: PriceQuotesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo báo giá mới' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  create(@Body() dto: CreatePriceQuoteDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách báo giá' })
  @ApiResponse({ status: 200, description: 'Danh sách' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Tìm kiếm theo tiêu đề',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Trang',
    type: Number,
  })
  @ApiQuery({
    name: 'perPage',
    required: false,
    description: 'Số lượng mỗi trang',
    type: Number,
  })
  findAll(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.service.findAll({
      search,
      page: page ? parseInt(page, 10) : 1,
      perPage: perPage ? parseInt(perPage, 10) : 10,
    });
  }

  @Get('featured')
  @ApiOperation({ summary: 'Danh sách báo giá nổi bật' })
  @ApiResponse({ status: 200, description: 'Danh sách báo giá nổi bật' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Số lượng',
    type: Number,
  })
  findFeatured(@Query('limit') limit?: string) {
    return this.service.findFeatured(limit ? parseInt(limit, 10) : 5);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết báo giá' })
  @ApiResponse({ status: 200, description: 'Chi tiết' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật báo giá' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePriceQuoteDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xoá báo giá' })
  @ApiResponse({ status: 204, description: 'Xoá thành công' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.service.remove(id);
  }
}
