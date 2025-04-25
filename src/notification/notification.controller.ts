import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { NotificationService } from "./notification.service";
import { AuthGuard } from "@nestjs/passport";
import { Body, Controller, Get, NotFoundException, Param, Patch, Post, Request, UseGuards } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FailedNotification } from "./entities/failed-notification.entity";
import { Repository } from "typeorm";
import { CreateNotificationDto } from "./dto/create-notification.dto";
import { NotificationSummaryResponseDto } from "./dto/notification-summary-response.dto";
import { NotificationResponseDto } from "./dto/notification-response.dto";

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService, @InjectRepository(FailedNotification)
  private readonly failedNotificationRepo: Repository<FailedNotification>,) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todas las notificaciones del usuario' })
  @ApiResponse({ type: [NotificationResponseDto] })
  getAll(@Request() req) {
    return this.notificationService.getAll(req.user.id);
  }

  @Post()
@ApiOperation({ summary: 'Crear una notificación manual' })
createNotification(
    @Body() dto: CreateNotificationDto,
  @Request() req
) {
  return this.notificationService.create(dto.title, dto.message, req.user.id);
}

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marcar una notificación como leída' })
  @ApiResponse({ schema: { example: { message: 'Notificación marcada como leída' } } })
  markAsRead(@Param('id') id: number, @Request() req) {
    return this.notificationService.markAsRead(id, req.user.id);
  }

  @Get('failed')
@ApiOperation({ summary: 'Listar notificaciones fallidas (admin)' })
getFailed() {
  return this.failedNotificationRepo.find({
    order: { createdAt: 'DESC' },
  });
}

@Post('retry/:id')
@ApiOperation({ summary: 'Reintentar envío de notificación fallida' })
async retry(@Param('id') id: number) {
  const failed = await this.failedNotificationRepo.findOneBy({ id });
  if (!failed) throw new NotFoundException('No encontrada');

  await this.notificationService.create(
    failed.title,
    failed.message,
    failed.userId,
  );

  await this.failedNotificationRepo.delete(id);
  return { message: 'Notificación reenviada correctamente' };
}

@Get('unread')
@ApiOperation({ summary: 'Obtener notificaciones no leídas del usuario actual' })
getUnread(@Request() req) {
  return this.notificationService.getUnread(req.user.id);
}

@Get('summary')
@ApiOperation({ summary: 'Resumen de notificaciones para dashboard' })
@ApiResponse({ type: NotificationSummaryResponseDto })
getSummary(@Request() req) {
  return this.notificationService.getSummary(req.user.id);
}




}
