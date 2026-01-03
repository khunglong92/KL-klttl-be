import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ReviewTargetType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt.guard';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiOperation({ summary: 'Gửi đánh giá mới (Public)' })
  @ApiResponse({ status: 201, description: 'Gửi thành công' })
  create(@Body() createReviewDto: CreateReviewDto) {
    return this.reviewsService.create(createReviewDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách đánh giá (Có phân trang, bộ lọc)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'targetType',
    required: false,
    enum: ReviewTargetType,
  })
  @ApiQuery({ name: 'targetId', required: false, type: String })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('targetType') targetType?: ReviewTargetType,
    @Query('targetId') targetId?: string,
  ) {
    const p = Number(page) > 0 ? Number(page) : 1;
    const l = Number(limit) > 0 ? Number(limit) : 10;
    return this.reviewsService.findAll(p, l, targetType, targetId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xoá đánh giá (Yêu cầu Admin/Login)' })
  @ApiResponse({ status: 200, description: 'Xoá thành công' })
  remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }
}
