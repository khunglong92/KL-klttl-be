import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AiChatService } from './ai-chat.service';
import { AiChatSettingsService } from './ai-chat-settings.service';
import { AiProviderProfileService } from './ai-provider-profile.service';
import { AiChatOpenAiClientService } from './ai-chat-openai-client.service';
import { AiChatErrorLogService } from './ai-chat-error-log.service';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateChatSettingsDto } from './dto/update-chat-settings.dto';
import { CreateProviderProfileDto } from './dto/create-provider-profile.dto';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import { TestProviderDraftDto } from './dto/test-provider-draft.dto';
import { SetProviderActiveDto } from './dto/set-provider-active.dto';

@ApiTags('AI Chat')
@Controller('ai-chat')
export class AiChatController {
  constructor(
    private readonly aiChatService: AiChatService,
    private readonly settingsService: AiChatSettingsService,
    private readonly providerProfileService: AiProviderProfileService,
    private readonly openaiClient: AiChatOpenAiClientService,
    private readonly errorLogService: AiChatErrorLogService,
  ) {}

  @Get('public-status')
  @ApiOperation({ summary: 'Kiểm tra chatbot có đang bật trên trang public' })
  @ApiResponse({ status: 200, description: 'Trạng thái chatbot' })
  async getPublicStatus(): Promise<{ isEnabled: boolean }> {
    const settings = await this.settingsService.getRuntimeConfig();
    const providers =
      await this.providerProfileService.getActiveProvidersForRuntime();
    return { isEnabled: settings.isEnabled && providers.length > 0 };
  }

  @Post('send')
  @ApiOperation({
    summary: 'Gửi tin nhắn tới trợ lý AI (public, streaming SSE)',
  })
  async sendMessage(
    @Body() dto: SendMessageDto,
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    try {
      for await (const token of this.aiChatService.sendMessage(
        dto.sessionId,
        dto.message,
      )) {
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      }
      res.write('data: [DONE]\n\n');
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : String(err);
      const message =
        rawMessage === 'CHAT_DISABLED'
          ? 'Trợ lý AI hiện đang tắt hoặc chưa được cấu hình khóa API. Vui lòng liên hệ quản trị viên.'
          : rawMessage;
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    } finally {
      res.end();
    }
  }

  @Get('settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy cấu hình chatbot' })
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Put('settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật cấu hình chatbot' })
  updateSettings(
    @Body() dto: UpdateChatSettingsDto,
    @Request() req: { user?: { email?: string } },
  ) {
    return this.settingsService.updateSettings(dto, req.user?.email);
  }

  @Get('providers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Danh sách cấu hình nhà cung cấp AI' })
  listProviders() {
    return this.providerProfileService.list();
  }

  @Post('providers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo cấu hình nhà cung cấp AI' })
  createProvider(
    @Body() dto: CreateProviderProfileDto,
    @Request() req: { user?: { email?: string } },
  ) {
    return this.providerProfileService.create(dto, req.user?.email);
  }

  @Put('providers/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật cấu hình nhà cung cấp AI' })
  updateProvider(
    @Param('id') id: string,
    @Body() dto: UpdateProviderProfileDto,
    @Request() req: { user?: { email?: string } },
  ) {
    return this.providerProfileService.update(id, dto, req.user?.email);
  }

  @Delete('providers/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xoá cấu hình nhà cung cấp AI' })
  async deleteProvider(@Param('id') id: string): Promise<void> {
    await this.providerProfileService.delete(id);
  }

  @Put('providers/:id/active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Bật/tắt 1 provider trong pool fallback (nhiều provider có thể cùng bật)',
  })
  setProviderActive(
    @Param('id') id: string,
    @Body() dto: SetProviderActiveDto,
  ) {
    return this.providerProfileService.setActive(id, dto.isActive);
  }

  @Post('providers/:id/test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Thử kết nối một cấu hình đã lưu' })
  async testProvider(@Param('id') id: string) {
    const config = await this.providerProfileService.getDecryptedById(id);
    return this.openaiClient.testConnection(config);
  }

  @Post('test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Thử kết nối một cấu hình chưa lưu' })
  testDraft(@Body() dto: TestProviderDraftDto) {
    return this.openaiClient.testConnection({
      baseUrl: dto.baseUrl,
      apiKey: dto.apiKey ?? null,
      model: dto.model,
    });
  }

  @Get('error-logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Nhật ký lỗi khi gọi AI provider (để theo dõi & xử lý kịp thời)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  getErrorLogs(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.errorLogService.getLogs(
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
    );
  }
}
