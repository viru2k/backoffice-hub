import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { NotificationService } from "./notification.service";
import { NotificationGateway } from "./notification.gateway";
import { AuthGuard } from "@nestjs/passport";
import { Body, Controller, Get, NotFoundException, Param, Patch, Post, Request, UseGuards } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FailedNotification } from "./entities/failed-notification.entity";
import { Repository } from "typeorm";
import { CreateNotificationDto } from "./dto/create-notification.dto";
import { NotificationSummaryResponseDto } from "./dto/notification-summary-response.dto";
import { NotificationResponseDto } from "./dto/notification-response.dto";
import { 
  NotificationOperationDto, 
  WebSocketTestResponseDto, 
  WebSocketStatsDto,
  FailedNotificationResponseDto 
} from "./dto/notification-operation.dto";
import { WebSocketTestDto } from "./dto/websocket-test.dto";
import { plainToInstance } from 'class-transformer';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService, 
    private readonly notificationGateway: NotificationGateway,
    @InjectRepository(FailedNotification)
    private readonly failedNotificationRepo: Repository<FailedNotification>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todas las notificaciones del usuario' })
  @ApiResponse({ type: [NotificationResponseDto] })
  async getAll(@Request() req): Promise<NotificationResponseDto[]> {
    const notifications = await this.notificationService.getAll(req.user.id);
    return plainToInstance(NotificationResponseDto, notifications, { excludeExtraneousValues: true });
  }

  @Post()
  @ApiOperation({ summary: 'Crear una notificación manual' })
  @ApiResponse({ type: NotificationResponseDto })
  async createNotification(
    @Body() dto: CreateNotificationDto,
    @Request() req
  ): Promise<NotificationResponseDto> {
    const notification = await this.notificationService.create(dto.title, dto.message, req.user.id);
    return plainToInstance(NotificationResponseDto, notification, { excludeExtraneousValues: true });
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marcar una notificación como leída' })
  @ApiResponse({ type: NotificationResponseDto })
  async markAsRead(@Param('id') id: number, @Request() req): Promise<NotificationResponseDto> {
    const notification = await this.notificationService.markAsRead(id, req.user.id);
    return plainToInstance(NotificationResponseDto, notification, { excludeExtraneousValues: true });
  }

  @Get('failed')
  @ApiOperation({ summary: 'Listar notificaciones fallidas (admin)' })
  @ApiResponse({ type: [FailedNotificationResponseDto] })
  async getFailed(): Promise<FailedNotificationResponseDto[]> {
    const failedNotifications = await this.failedNotificationRepo.find({
      order: { createdAt: 'DESC' },
    });
    return plainToInstance(FailedNotificationResponseDto, failedNotifications, { excludeExtraneousValues: true });
  }

  @Post('retry/:id')
  @ApiOperation({ summary: 'Reintentar envío de notificación fallida' })
  @ApiResponse({ type: NotificationOperationDto })
  async retry(@Param('id') id: number): Promise<NotificationOperationDto> {
    const failed = await this.failedNotificationRepo.findOneBy({ id });
    if (!failed) throw new NotFoundException('No encontrada');

    await this.notificationService.create(
      failed.title,
      failed.message,
      failed.userId,
    );

    await this.failedNotificationRepo.delete(id);
    return new NotificationOperationDto('Notificación reenviada correctamente');
  }

  @Get('unread')
  @ApiOperation({ summary: 'Obtener notificaciones no leídas del usuario actual' })
  @ApiResponse({ type: [NotificationResponseDto] })
  async getUnread(@Request() req): Promise<NotificationResponseDto[]> {
    const notifications = await this.notificationService.getUnread(req.user.id);
    return plainToInstance(NotificationResponseDto, notifications, { excludeExtraneousValues: true });
  }

  @Get('summary')
  @ApiOperation({ summary: 'Resumen de notificaciones para dashboard' })
  @ApiResponse({ type: NotificationSummaryResponseDto })
  async getSummary(@Request() req): Promise<NotificationSummaryResponseDto> {
    const summary = await this.notificationService.getSummary(req.user.id);
    return plainToInstance(NotificationSummaryResponseDto, summary, { excludeExtraneousValues: true });
  }

  @Post('test-websocket')
  @ApiOperation({ summary: 'Enviar notificación de prueba por WebSocket' })
  @ApiResponse({ type: WebSocketTestResponseDto })
  async testWebSocket(@Request() req, @Body() body: WebSocketTestDto): Promise<WebSocketTestResponseDto> {
    const notification = {
      type: 'test_notification',
      title: 'Notificación de Prueba',
      message: body.message || 'Esta es una notificación de prueba enviada por WebSocket',
      timestamp: new Date().toISOString(),
      userId: req.user.id,
    };

    await this.notificationGateway.sendNotificationToUser(req.user.id, notification);
    
    const response = {
      message: 'Notificación WebSocket enviada exitosamente',
      notification,
      stats: this.notificationGateway.getConnectionStats(),
    };

    return plainToInstance(WebSocketTestResponseDto, response, { excludeExtraneousValues: true });
  }

  @Post('test-broadcast')
  @ApiOperation({ summary: 'Enviar notificación broadcast de prueba por WebSocket' })
  @ApiResponse({ type: WebSocketTestResponseDto })
  async testBroadcast(@Request() req, @Body() body: WebSocketTestDto): Promise<WebSocketTestResponseDto> {
    const notification = {
      type: 'broadcast_test',
      title: 'Notificación Broadcast',
      message: body.message || 'Esta es una notificación broadcast de prueba',
      timestamp: new Date().toISOString(),
      from: req.user.email,
    };

    this.notificationGateway.sendBroadcastNotification(notification);
    
    const response = {
      message: 'Notificación broadcast enviada exitosamente',
      notification,
      stats: this.notificationGateway.getConnectionStats(),
    };

    return plainToInstance(WebSocketTestResponseDto, response, { excludeExtraneousValues: true });
  }

  @Get('websocket-stats')
  @ApiOperation({ summary: 'Obtener estadísticas de conexiones WebSocket' })
  @ApiResponse({ type: WebSocketStatsDto })
  getWebSocketStats(): WebSocketStatsDto {
    const stats = this.notificationGateway.getConnectionStats();
    return plainToInstance(WebSocketStatsDto, stats, { excludeExtraneousValues: true });
  }




}
