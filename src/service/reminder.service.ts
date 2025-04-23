import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { addMinutes, format, isAfter } from 'date-fns';
import { Appointment } from 'src/agenda/entities/appointment.entity';
import { AgendaConfig } from 'src/agenda/entities/agenda-config.entity';
import { NotificationService } from 'src/notification/notification.service';
import { FailedNotification } from 'src/notification/entities/failed-notification.entity';
import { Between, In, IsNull, Repository } from 'typeorm';

@Injectable()
export class ReminderService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,

    @InjectRepository(AgendaConfig)
    private readonly agendaConfigRepo: Repository<AgendaConfig>,

    @InjectRepository(FailedNotification)
    private readonly failedNotificationRepo: Repository<FailedNotification>,

    private readonly notificationService: NotificationService
  ) {}

  @Cron('*/1 * * * *') // Ejecutar cada minuto
  async sendReminders() {
    const now = new Date();
    const configs = await this.agendaConfigRepo.find({ relations: ['user'] });

    for (const config of configs) {
      const userId = config.user.id;
      const offset = config.reminderOffsetMinutes || 60;

      const reminderTime = addMinutes(now, offset);

      const upcomingAppointments = await this.appointmentRepo.find({
        where: {
          user: { id: userId },
          status: In(['confirmed']),
          date: Between(now, reminderTime),
          reminderSentAt: IsNull(),
        },
        relations: ['user'],
      });

      for (const appointment of upcomingAppointments) {
        try {
          const timeText = format(appointment.date, 'HH:mm');
          await this.notificationService.create(
            'Recordatorio de turno',
            `Tenés un turno para ${appointment.title} a las ${timeText}`,
            userId,
          );

          appointment.reminderSentAt = new Date();
          await this.appointmentRepo.save(appointment);
        } catch (error) {
          await this.failedNotificationRepo.save({
            userId,
            title: 'Recordatorio de turno',
            message: `Turno para ${appointment.title} a las ${format(appointment.date, 'HH:mm')}`,
            error: error.message || 'Error desconocido',
          });
        }
      }
    }
  }
}
