import { Controller, Get, UseGuards } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('statistics')
@Controller('statistics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
@ApiBearerAuth()
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard summary counts' })
  async getDashboardStats() {
    return this.statisticsService.getDashboardStats();
  }

  @Get('growth')
  @ApiOperation({
    summary: 'Get growth statistics (quotes, contacts) for charts',
  })
  async getGrowthStats() {
    return this.statisticsService.getGrowthStats();
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get category distribution statistics' })
  async getCategoryStats() {
    return this.statisticsService.getCategoryStats();
  }
}
