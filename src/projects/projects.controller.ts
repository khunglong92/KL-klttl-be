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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo dự án mới' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  create(@Body() dto: CreateProjectDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách dự án (có phân trang)' })
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
    name: 'isFeatured',
    required: false,
    description: 'Lọc dự án nổi bật',
    type: Boolean,
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách dự án với phân trang',
    schema: {
      example: {
        pagination: { total: 0, page: 1, perpage: 10 },
        data: [],
      },
    },
  })
  findAll(
    @Query('page') page?: string,
    @Query('perpage') perpage?: string,
    @Query('isFeatured') isFeatured?: string,
  ) {
    const p = Number(page) > 0 ? Number(page) : 1;
    const pp =
      Number(perpage) > 0 && Number(perpage) <= 100 ? Number(perpage) : 10;
    const featured =
      isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined;
    return this.service.findAll(p, pp, featured);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết dự án' })
  @ApiResponse({ status: 200, description: 'Chi tiết dự án' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật dự án' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xoá dự án' })
  @ApiResponse({ status: 204, description: 'Xoá thành công' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.service.remove(id);
  }
}
