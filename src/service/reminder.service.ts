import { Injectable, Logger } from '@nestjs/common'; // Logger añadido para depuración
import { Cron, CronExpression } from '@nestjs/schedule'; // CronExpression para mejor semántica
import { InjectRepository } from '@nestjs/typeorm';
import { addMinutes, format, isAfter, parseISO } from 'date-fns'; // parseISO no es estrictamente necesario aquí si la fecha ya es objeto Date
import { Appointment } from 'src/agenda/entities/appointment.entity';
import { AgendaConfig } from 'src/agenda/entities/agenda-config.entity';
import { NotificationService } from 'src/notification/notification.service';
import { FailedNotification } from 'src/notification/entities/failed-notification.entity';
import { Between, In, IsNull, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm'; // Importaciones de TypeORM
import { User } from 'src/user/entities/user.entity'; // Importar User

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name); // Logger para el servicio

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,

    @InjectRepository(AgendaConfig)
    private readonly agendaConfigRepo: Repository<AgendaConfig>, // La relación aquí es 'user'

    @InjectRepository(FailedNotification)
    private readonly failedNotificationRepo: Repository<FailedNotification>,

    private readonly notificationService: NotificationService,
  ) {}

  // Ejecutar cada minuto
  @Cron(CronExpression.EVERY_MINUTE)
  async sendReminders() {
    this.logger.debug('Ejecutando sendReminders cron job...');
    const now = new Date();
    
    // Obtener todas las configuraciones de agenda.
    // AgendaConfig tiene una relación 'user' que es el profesional.
    const configs = await this.agendaConfigRepo.find({ relations: ['user'] });
    if (!configs.length) {
        this.logger.debug('No hay configuraciones de agenda encontradas.');
        return;
    }

    for (const config of configs) {
      if (!config.user || !config.user.id) {
        this.logger.warn(`Configuración de agenda ID ${config.id} no tiene un usuario asociado o el usuario no tiene ID.`);
        continue;
      }

      const professionalUserId = config.user.id; // Este es el ID del profesional
      const reminderOffsetMinutes = config.reminderOffsetMinutes || 60; // Minutos de antelación para el recordatorio

      // Calcular el rango de tiempo para los recordatorios:
      // Desde 'ahora' hasta 'ahora + offset'.
      // Los turnos cuya startDateTime caiga en esta ventana y no tengan recordatorio enviado.
      const reminderWindowStart = now;
      const reminderWindowEnd = addMinutes(now, reminderOffsetMinutes);

      this.logger.debug(`Revisando profesional ID: ${professionalUserId}, ventana: ${format(reminderWindowStart, 'Pp')} - ${format(reminderWindowEnd, 'Pp')}`);

      const upcomingAppointments = await this.appointmentRepo.find({
        where: {
          professional: { id: professionalUserId }, // Filtrar por el ID del profesional
          status: In(['confirmed', 'pending']),    // Considerar turnos confirmados o pendientes
          startDateTime: Between(reminderWindowStart, reminderWindowEnd), // Usar startDateTime y el rango correcto
          reminderSentAt: IsNull(), // Solo turnos a los que no se les ha enviado recordatorio
        },
        relations: ['professional', 'client'], // Cargar profesional y cliente para la notificación si es necesario
      });

      if (upcomingAppointments.length > 0) {
         this.logger.log(`Encontrados ${upcomingAppointments.length} turnos para recordar al profesional ID: ${professionalUserId}`);
      }

      for (const appointment of upcomingAppointments) {
        try {
       
          const notificationRecipientUserId = professionalUserId; // O appointment.client.owner.id si el recordatorio es para el cliente
                                                              // y el cliente tiene un 'owner' User.
                                                              // O si el cliente tiene su propio userId (si Client puede ser User).

          // El mensaje usa appointment.title y la hora formateada de startDateTime
          const timeText = format(appointment.startDateTime, 'HH:mm'); // Usar startDateTime
          const message = `Recordatorio: Turno para "${appointment.title}" a las ${timeText}.`;
          
          this.logger.log(`Enviando notificación para turno ID ${appointment.id}: ${message}`);

          await this.notificationService.create(
            'Recordatorio de Turno', // Título de la notificación
            message,                 // Mensaje
            notificationRecipientUserId,  // A quién se le envía la notificación
          );

          appointment.reminderSentAt = new Date();
          await this.appointmentRepo.save(appointment);
          this.logger.log(`Recordatorio enviado y marcado para turno ID ${appointment.id}`);

        } catch (error) {
          this.logger.error(`Error enviando recordatorio para turno ID ${appointment.id}: ${error.message}`, error.stack);
          await this.failedNotificationRepo.save({
            userId: professionalUserId, // O el ID del destinatario que falló
            title: 'Recordatorio de Turno (Fallo)',
            message: `Fallo al recordar turno para ${appointment.title} a las ${format(appointment.startDateTime, 'HH:mm')}. Error: ${error.message}`, // Usar startDateTime
            error: error.message || 'Error desconocido al enviar recordatorio',
          });
        }
      }
    }
    this.logger.debug('sendReminders cron job finalizado.');
  }
}