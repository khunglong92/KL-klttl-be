import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

import { CompanyIntroService } from './company-intro.service';
import { CreateCompanyIntroDto } from './dto/create-company-intro.dto';
import { UpdateCompanyIntroDto } from './dto/update-company-intro.dto';

@ApiTags('Company Intro')
@Controller('company-intros')
export class CompanyIntroController {
  constructor(private readonly service: CompanyIntroService) {}

  // ===================== PUBLIC =====================

  @Get()
  @ApiOperation({
    summary: 'Get active company intro list',
    description: 'Public API – dùng cho FE hiển thị intro / banner công ty',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách intro đang active',
  })
  findAllActive() {
    return this.service.findAllActive();
  }

  // ===================== ADMIN =====================

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all company intros (admin)',
    description: 'Admin API – lấy toàn bộ intro chưa bị xoá',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách intro (admin)',
  })
  findAllAdmin() {
    return this.service.findAllAdmin();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create company intro',
    description: 'Admin API – tạo mới company intro',
  })
  @ApiBody({ type: CreateCompanyIntroDto })
  @ApiResponse({
    status: 201,
    description: 'Tạo intro thành công',
  })
  create(@Body() dto: CreateCompanyIntroDto) {
    return this.service.create(dto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get company intro detail',
    description: 'Lấy chi tiết 1 intro theo ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Company intro ID',
    example: 'uuid-string',
  })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết company intro',
  })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update company intro',
    description: 'Admin API – cập nhật thông tin intro',
  })
  @ApiParam({
    name: 'id',
    description: 'Company intro ID',
  })
  @ApiBody({ type: UpdateCompanyIntroDto })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thành công',
  })
  update(@Param('id') id: string, @Body() dto: UpdateCompanyIntroDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Toggle active company intro',
    description: 'Admin API – bật / tắt intro',
  })
  @ApiParam({
    name: 'id',
    description: 'Company intro ID',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        isActive: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật trạng thái active',
  })
  toggleActive(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.service.toggleActive(id, isActive);
  }

  @Patch(':id/order')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update company intro order',
    description: 'Admin API – cập nhật thứ tự hiển thị',
  })
  @ApiParam({
    name: 'id',
    description: 'Company intro ID',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        orderIndex: {
          type: 'number',
          example: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật order thành công',
  })
  updateOrder(@Param('id') id: string, @Body('orderIndex') orderIndex: number) {
    return this.service.updateOrder(id, orderIndex);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Soft delete company intro',
    description: 'Admin API – xoá mềm intro',
  })
  @ApiParam({
    name: 'id',
    description: 'Company intro ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Xoá mềm thành công',
  })
  softDelete(@Param('id') id: string) {
    return this.service.softDelete(id);
  }
}
