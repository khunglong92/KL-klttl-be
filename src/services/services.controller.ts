import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceStatus } from '@prisma/client';
import { ParseArrayPipe } from '@nestjs/common';
import { ReorderServiceItemDto } from './dto/reorder-service.dto';

@ApiTags('Services')
@ApiBearerAuth()
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo dịch vụ mới' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  create(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @Patch('reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Sắp xếp lại thứ tự dịch vụ',
    description: 'Nhận vào mảng các object { id, orderIndex } để cập nhật.',
  })
  @ApiResponse({ status: 200, description: 'Sắp xếp thành công' })
  reorder(
    @Body(new ParseArrayPipe({ items: ReorderServiceItemDto }))
    items: ReorderServiceItemDto[],
  ) {
    return this.servicesService.reorder(items);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách dịch vụ (có phân trang)' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Số trang (mặc định là 1)',
    type: Number,
  })
  @ApiQuery({
    name: 'perpage',
    required: false,
    description: 'Số lượng mỗi trang (mặc định là 10)',
    type: Number,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Lọc theo trạng thái',
    enum: ['draft', 'published', 'archived'],
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách dịch vụ với phân trang',
    schema: {
      example: {
        pagination: { total: 0, page: 1, perpage: 10 },
        data: [],
      },
    },
  })
  async findAll(
    @Query('page') page?: string,
    @Query('perpage') perpage?: string,
    @Query('status') status?: ServiceStatus,
    @Query('search') search?: string,
  ) {
    const p = Number(page) > 0 ? Number(page) : 1;
    const pp =
      Number(perpage) > 0 && Number(perpage) <= 100 ? Number(perpage) : 10;
    const result = await this.servicesService.findAll(p, pp, status, search);
    return result;
  }

  @Get('featured')
  @ApiOperation({ summary: 'Danh sách dịch vụ nổi bật (có phân trang)' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Số trang (mặc định là 1)',
    type: Number,
  })
  @ApiQuery({
    name: 'perpage',
    required: false,
    description: 'Số lượng mỗi trang (mặc định là 10)',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách dịch vụ nổi bật với phân trang',
    schema: {
      example: {
        pagination: { total: 0, page: 1, perpage: 10 },
        data: [],
      },
    },
  })
  findFeatured(
    @Query('page') page?: string,
    @Query('perpage') perpage?: string,
  ) {
    const p = Number(page) > 0 ? Number(page) : 1;
    const pp =
      Number(perpage) > 0 && Number(perpage) <= 100 ? Number(perpage) : 10;
    return this.servicesService.findFeatured(p, pp);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết dịch vụ' })
  @ApiResponse({ status: 200, description: 'Chi tiết dịch vụ' })
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật dịch vụ' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xoá dịch vụ' })
  @ApiResponse({ status: 204, description: 'Xoá thành công' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.servicesService.remove(id);
  }
}
