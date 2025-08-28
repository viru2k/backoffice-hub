import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EmailService } from './email.service';
import { EmailQueueService } from './services/email-queue.service';
import { EmailAnalyticsService } from './services/email-analytics.service';
import { 
  EmailSettingsDto, 
  UpdateEmailSettingsDto, 
  EmailSettingsResponseDto, 
  TestConnectionResponseDto 
} from './dto/email-settings.dto';
import { 
  CreateEmailTemplateDto, 
  UpdateEmailTemplateDto, 
  EmailTemplateResponseDto 
} from './dto/email-template.dto';
import { 
  SendEmailDto, 
  SendTemplateEmailDto, 
  BulkEmailDto, 
  EmailSendResponseDto, 
  BulkEmailResponseDto 
} from './dto/send-email.dto';
import { 
  EmailLogsQueryDto, 
  EmailLogsPaginatedResponseDto, 
  EmailLogResponseDto, 
  EmailMetricsResponseDto, 
  EmailMetricsSummaryDto, 
  DateRangeQueryDto 
} from './dto/email-logs.dto';
import { EmailOperationResultDto } from './dto/email-operation-result.dto';

@Controller('email')
@ApiTags('Email Management')
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly emailQueueService: EmailQueueService,
    private readonly emailAnalyticsService: EmailAnalyticsService,
  ) {}

  // === SMTP CONFIGURATION ===

  @Post('settings')
  @ApiOperation({ summary: 'Crear nueva configuración SMTP' })
  @ApiResponse({ status: 201, type: EmailSettingsResponseDto })
  async createEmailSettings(@Body() settings: EmailSettingsDto): Promise<EmailSettingsResponseDto> {
    return await this.emailService.createEmailSettings(settings);
  }

  @Post('settings/save')
  @ApiOperation({ summary: 'Guardar configuración SMTP (método legacy)' })
  @ApiResponse({ status: 201, description: 'Configuración guardada exitosamente' })
  async saveEmailSettings(@Body() settings: EmailSettingsDto): Promise<void> {
    return await this.emailService.saveEmailSettings(settings);
  }

  @Post('settings/validate')
  @ApiOperation({ summary: 'Validar configuración SMTP sin guardar' })
  @ApiResponse({ status: 200, type: TestConnectionResponseDto })
  async validateSmtpSettings(@Body() settings: EmailSettingsDto): Promise<TestConnectionResponseDto> {
    return await this.emailService.validateSmtpSettings(settings);
  }

  @Get('settings')
  @ApiOperation({ summary: 'Obtener configuración SMTP actual' })
  @ApiResponse({ status: 200, type: EmailSettingsResponseDto })
  async getEmailSettings(): Promise<EmailSettingsResponseDto> {
    return await this.emailService.getEmailSettings();
  }

  @Put('settings/:id')
  @ApiOperation({ summary: 'Actualizar configuración SMTP' })
  @ApiResponse({ status: 200, description: 'Configuración actualizada exitosamente' })
  async updateEmailSettings(
    @Param('id') id: string,
    @Body() settings: UpdateEmailSettingsDto,
  ): Promise<void> {
    return await this.emailService.updateEmailSettings(id, settings);
  }

  @Post('settings/test')
  @ApiOperation({ summary: 'Probar conexión SMTP' })
  @ApiResponse({ status: 200, type: TestConnectionResponseDto })
  async testSmtpConnection(): Promise<TestConnectionResponseDto> {
    return await this.emailService.testSmtpConnection();
  }

  // === EMAIL TEMPLATES ===

  @Get('templates')
  @ApiOperation({ summary: 'Listar todas las plantillas' })
  @ApiResponse({ status: 200, type: [EmailTemplateResponseDto] })
  async getAllTemplates(): Promise<EmailTemplateResponseDto[]> {
    return await this.emailService.getTemplates();
  }

  @Post('templates')
  @ApiOperation({ summary: 'Crear nueva plantilla' })
  @ApiResponse({ status: 201, type: EmailTemplateResponseDto })
  async createTemplate(
    @Body() template: CreateEmailTemplateDto,
    @Request() req: any,
  ): Promise<EmailTemplateResponseDto> {
    const userId = req.user?.id || 'system';
    return await this.emailService.createTemplate(template, userId);
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Obtener plantilla por ID' })
  @ApiResponse({ status: 200, type: EmailTemplateResponseDto })
  async getTemplateById(@Param('id') id: string): Promise<EmailTemplateResponseDto> {
    return await this.emailService.getTemplateById(id);
  }

  @Put('templates/:id')
  @ApiOperation({ summary: 'Actualizar plantilla' })
  @ApiResponse({ status: 200, type: EmailTemplateResponseDto })
  async updateTemplate(
    @Param('id') id: string,
    @Body() template: UpdateEmailTemplateDto,
  ): Promise<EmailTemplateResponseDto> {
    return await this.emailService.updateTemplate(id, template);
  }

  @Delete('templates/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar plantilla' })
  @ApiResponse({ status: 204, description: 'Plantilla eliminada exitosamente' })
  async deleteTemplate(@Param('id') id: string): Promise<void> {
    return await this.emailService.deleteTemplate(id);
  }

  // === EMAIL SENDING ===

  @Post('send')
  @ApiOperation({ summary: 'Enviar email personalizado' })
  @ApiResponse({ status: 200, type: EmailSendResponseDto })
  async sendCustomEmail(@Body() emailData: SendEmailDto): Promise<EmailSendResponseDto> {
    return await this.emailService.sendEmail(emailData);
  }

  @Post('send/template')
  @ApiOperation({ summary: 'Enviar email usando plantilla' })
  @ApiResponse({ status: 200, type: EmailSendResponseDto })
  async sendTemplateEmail(@Body() emailData: SendTemplateEmailDto): Promise<EmailSendResponseDto> {
    return await this.emailService.sendTemplateEmail(emailData);
  }

  @Post('send/bulk')
  @ApiOperation({ summary: 'Envío masivo de emails' })
  @ApiResponse({ status: 200, type: BulkEmailResponseDto })
  async sendBulkEmails(@Body() bulkData: BulkEmailDto): Promise<BulkEmailResponseDto> {
    return await this.emailService.sendBulkEmails(bulkData);
  }

  // === USER INTEGRATION ===

  @Post('send/welcome/:userId')
  @ApiOperation({ summary: 'Enviar email de bienvenida' })
  @ApiResponse({ status: 200, type: EmailSendResponseDto })
  async sendWelcomeEmail(@Param('userId') userId: string): Promise<EmailSendResponseDto> {
    return await this.emailService.sendWelcomeEmailByUserId(userId);
  }

  @Post('send/password-reset/:userId')
  @ApiOperation({ summary: 'Enviar email de reset de contraseña' })
  @ApiResponse({ status: 200, type: EmailSendResponseDto })
  async sendPasswordResetEmail(@Param('userId') userId: string): Promise<EmailSendResponseDto> {
    return await this.emailService.sendPasswordResetEmailByUserId(userId);
  }

  @Post('send/appointment-reminder/:appointmentId')
  @ApiOperation({ summary: 'Enviar recordatorio de cita' })
  @ApiResponse({ status: 200, type: EmailSendResponseDto })
  async sendAppointmentReminder(@Param('appointmentId') appointmentId: string): Promise<EmailSendResponseDto> {
    return await this.emailService.sendAppointmentReminderByAppointmentId(appointmentId);
  }

  // === LOGS AND ANALYTICS ===

  @Get('logs')
  @ApiOperation({ summary: 'Obtener logs de emails enviados' })
  @ApiResponse({ status: 200, type: EmailLogsPaginatedResponseDto })
  async getEmailLogs(@Query() query: EmailLogsQueryDto): Promise<EmailLogsPaginatedResponseDto> {
    return await this.emailAnalyticsService.getEmailLogs(query);
  }

  @Get('logs/failed')
  @ApiOperation({ summary: 'Obtener emails fallidos' })
  @ApiResponse({ status: 200, type: [EmailLogResponseDto] })
  async getFailedEmails(): Promise<EmailLogResponseDto[]> {
    return await this.emailAnalyticsService.getFailedEmails();
  }

  @Post('logs/retry/:logId')
  @ApiOperation({ summary: 'Reintentar envío de email fallido' })
  @ApiResponse({ status: 200, type: EmailOperationResultDto })
  async retryFailedEmail(@Param('logId') logId: string): Promise<EmailOperationResultDto> {
    await this.emailQueueService.retryFailedEmail(logId);
    return new EmailOperationResultDto('Email queued for retry', true, 'retry');
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Obtener métricas del sistema de email' })
  @ApiResponse({ status: 200, type: EmailMetricsResponseDto })
  async getEmailMetrics(@Query() dateRange: DateRangeQueryDto): Promise<EmailMetricsResponseDto> {
    return await this.emailAnalyticsService.getEmailMetrics(dateRange);
  }

  @Get('metrics/summary')
  @ApiOperation({ summary: 'Resumen rápido de métricas' })
  @ApiResponse({ status: 200, type: EmailMetricsSummaryDto })
  async getMetricsSummary(): Promise<EmailMetricsSummaryDto> {
    return await this.emailAnalyticsService.getMetricsSummary();
  }

  // === TRACKING ===

  @Post('track/open/:emailId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registrar apertura de email' })
  async trackEmailOpen(@Param('emailId') emailId: string): Promise<{ success: boolean }> {
    await this.emailAnalyticsService.trackOpen(emailId);
    return { success: true };
  }

  @Post('track/click/:emailId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registrar click en email' })
  async trackEmailClick(
    @Param('emailId') emailId: string,
    @Body('url') url: string,
  ): Promise<{ success: boolean }> {
    await this.emailAnalyticsService.trackClick(emailId, url);
    return { success: true };
  }

  // === QUEUE MANAGEMENT ===

  @Get('queue/stats')
  @ApiOperation({ summary: 'Obtener estadísticas de cola' })
  @ApiResponse({ status: 200, description: 'Estadísticas de la cola de emails' })
  async getQueueStats(): Promise<any> {
    return await this.emailQueueService.getQueueStats();
  }

  @Post('queue/pause')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pausar cola de emails' })
  @ApiResponse({ type: EmailOperationResultDto })
  async pauseQueue(): Promise<EmailOperationResultDto> {
    await this.emailQueueService.pauseQueue();
    return new EmailOperationResultDto('Email queue paused', true, 'pause');
  }

  @Post('queue/resume')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reanudar cola de emails' })
  @ApiResponse({ type: EmailOperationResultDto })
  async resumeQueue(): Promise<EmailOperationResultDto> {
    await this.emailQueueService.resumeQueue();
    return new EmailOperationResultDto('Email queue resumed', true, 'resume');
  }

  @Post('queue/clean')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Limpiar cola de emails' })
  @ApiResponse({ type: EmailOperationResultDto })
  async cleanQueue(): Promise<EmailOperationResultDto> {
    await this.emailQueueService.cleanQueue();
    return new EmailOperationResultDto('Email queue cleaned', true, 'clean');
  }
}