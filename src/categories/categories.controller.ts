import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  ParseArrayPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ReorderCategoryItemDto } from './dto/reorder-category.dto';

@ApiTags('Categories')
@ApiBearerAuth()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Tạo danh mục mới',
    description:
      'Tạo danh mục với các trường: name (bắt buộc), description (tùy chọn).',
  })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  create(@Body() body: CreateCategoryDto) {
    return this.categoriesService.create(body);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách danh mục (loại trừ xoá mềm)' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách các danh mục',
  })
  findAll() {
    // Simple: giữ nguyên trả mảng, có thể nâng cấp phân trang sau
    return this.categoriesService.findAll();
  }

  @Patch('reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Sắp xếp lại thứ tự danh mục',
    description: 'Nhận vào mảng các object { id, orderIndex } để cập nhật.',
  })
  @ApiResponse({ status: 200, description: 'Sắp xếp thành công' })
  reorder(
    @Body(new ParseArrayPipe({ items: ReorderCategoryItemDto }))
    items: ReorderCategoryItemDto[],
  ) {
    return this.categoriesService.reorder(items);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết danh mục' })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết danh mục',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cập nhật danh mục',
    description:
      'Cập nhật các trường: name?, description?, updatedByUserId?, updatedByName?.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thành công',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xoá danh mục' })
  @ApiResponse({ status: 204, description: 'Xoá thành công' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.categoriesService.remove(id);
  }
}
