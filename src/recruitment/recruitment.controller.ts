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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RecruitmentService } from './recruitment.service';
import { CreateRecruitmentDto } from './dto/create-recruitment.dto';
import { UpdateRecruitmentDto } from './dto/update-recruitment.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Recruitment')
@ApiBearerAuth()
@Controller('recruitment')
export class RecruitmentController {
  constructor(private readonly service: RecruitmentService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo tin tuyển dụng mới' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  create(@Body() dto: CreateRecruitmentDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách tin tuyển dụng' })
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
  @ApiOperation({ summary: 'Danh sách tin nổi bật' })
  @ApiResponse({ status: 200, description: 'Danh sách tin nổi bật' })
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
  @ApiOperation({ summary: 'Chi tiết tin tuyển dụng' })
  @ApiResponse({ status: 200, description: 'Chi tiết' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật tin tuyển dụng' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRecruitmentDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xoá tin tuyển dụng' })
  @ApiResponse({ status: 204, description: 'Xoá thành công' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.service.remove(id);
  }
}
