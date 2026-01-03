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
  Request,
  ParseArrayPipe,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ReorderProductItemDto } from './dto/reorder-product.dto';

@ApiTags('Products')
@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Tạo sản phẩm mới',
    description:
      'Fields: name (required), price?, images?, description (short description array)?, detailedDescription (Minio Key)?, categoryId (required), isFeatured?, showPrice?, reviews?.',
  })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  create(@Body() body: CreateProductDto) {
    return this.productsService.create(body);
  }

  @Get()
  @ApiOperation({
    summary:
      'Danh sách sản phẩm (có phân trang, lọc theo danh mục, loại trừ xoá mềm)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Số trang (mặc định là 1)',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Số lượng sản phẩm mỗi trang (mặc định là 10, tối đa 100)',
    type: Number,
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Lọc theo ID danh mục',
    type: Number,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Tìm kiếm theo tên sản phẩm (không phân biệt hoa thường)',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách sản phẩm với phân trang',
    schema: {
      example: {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      },
    },
  })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
  ) {
    const p = Number(page) > 0 ? Number(page) : 1;
    const l = Number(limit) > 0 && Number(limit) <= 100 ? Number(limit) : 10;
    const cId = categoryId ? parseInt(categoryId, 10) : undefined;
    return this.productsService.findAll(p, l, cId, search);
  }

  @Patch('reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Sắp xếp lại thứ tự sản phẩm',
    description: 'Nhận vào mảng các object { id, orderIndex } để cập nhật.',
  })
  @ApiResponse({ status: 200, description: 'Sắp xếp thành công' })
  reorder(
    @Body(new ParseArrayPipe({ items: ReorderProductItemDto }))
    items: ReorderProductItemDto[],
  ) {
    return this.productsService.reorder(items);
  }

  @Get('featured')
  @ApiOperation({
    summary: 'Danh sách sản phẩm nổi bật (có phân trang)',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách sản phẩm nổi bật với phân trang',
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
    return this.productsService.findFeatured(p, pp);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết sản phẩm' })
  @ApiResponse({ status: 200, description: 'Chi tiết sản phẩm' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật sản phẩm' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thành công',
  })
  update(@Param('id') id: string, @Body() body: UpdateProductDto) {
    return this.productsService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xoá mềm sản phẩm' })
  @ApiResponse({ status: 204, description: 'Xoá thành công' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.productsService.remove(id);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Thích một sản phẩm' })
  @ApiResponse({
    status: 201,
    description: 'Sản phẩm đã được thích thành công',
  })
  @ApiResponse({ status: 400, description: 'Bạn đã thích sản phẩm này rồi' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
  likeProduct(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.id; // Lấy userId từ token đã xác thực
    return this.productsService.likeProduct(id, userId);
  }

  @Delete(':id/unlike')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bỏ thích một sản phẩm' })
  @ApiResponse({ status: 200, description: 'Đã bỏ thích sản phẩm thành công' })
  @ApiResponse({ status: 400, description: 'Bạn chưa thích sản phẩm này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
  unlikeProduct(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.id;
    return this.productsService.unlikeProduct(id, userId);
  }

  @Get(':id/like-status')
  @ApiOperation({
    summary: 'Kiểm tra người dùng hiện tại đã thích sản phẩm chưa (Guest ok)',
  })
  @ApiResponse({ status: 200, description: 'Trả về trạng thái boolean' })
  async checkUserLiked(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<{ liked: boolean }> {
    const userId = req.user?.id;
    if (!userId) return { liked: false };
    const liked = await this.productsService.checkUserLiked(id, userId);
    return { liked };
  }
}
