import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { 
  addDays, 
  subMonths, 
  startOfDay, 
  endOfDay, 
  format,
  addMinutes,
  subHours 
} from 'date-fns';
import { EmailService } from '../email/email.service';
import { NotificationService } from './notification.service';
import { User } from '../user/entities/user.entity';
import { Client } from '../client/entities/client.entity';
import { Appointment, AppointmentStatus } from '../agenda/entities/appointment.entity';

@Injectable()
export class AutomatedNotificationService {
  private readonly logger = new Logger(AutomatedNotificationService.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly notificationService: NotificationService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Client) private readonly clientRepo: Repository<Client>,
    @InjectRepository(Appointment) private readonly appointmentRepo: Repository<Appointment>,
  ) {}

  // === RECORDATORIOS DE CITAS - Diario 9 AM ===
  @Cron('0 9 * * *')
  async sendAppointmentReminders() {
    if (process.env.ENABLE_APPOINTMENT_REMINDERS !== 'true') {
      this.logger.debug('Recordatorios de citas deshabilitados');
      return;
    }

    this.logger.log('🔄 Enviando recordatorios de citas...');
    const tomorrow = addDays(new Date(), 1);
    
    try {
      const appointments = await this.appointmentRepo.find({
        where: { 
          startDateTime: Between(startOfDay(tomorrow), endOfDay(tomorrow)),
          status: AppointmentStatus.CONFIRMED
        },
        relations: ['client', 'professional']
      });

      this.logger.log(`📅 Encontradas ${appointments.length} citas para mañana`);

      for (const apt of appointments) {
        try {
          // Verificar que el cliente tenga email
          if (!apt.client?.email) {
            this.logger.warn(`Cliente sin email para cita ID: ${apt.id}`);
            continue;
          }

          await this.emailService.sendTemplateEmail({
            to: [apt.client.email],
            templateId: 'appointment-reminder',
            templateVariables: {
              clientName: apt.client.name,
              appointmentDate: format(apt.startDateTime, 'dd/MM/yyyy'),
              appointmentTime: format(apt.startDateTime, 'HH:mm'),
              professionalName: apt.professional?.name || 'Profesional',
              service: apt.title,
              clinicName: process.env.CLINIC_NAME || 'Nuestra Clínica',
              cancelLink: `${process.env.FRONTEND_URL}/cancel-appointment/${apt.id}`,
              confirmLink: `${process.env.FRONTEND_URL}/confirm-appointment/${apt.id}`
            }
          });

          // Marcar como enviado - usar campo existente
          apt.reminderSentAt = new Date();
          await this.appointmentRepo.save(apt);

          this.logger.log(`✅ Recordatorio enviado: ${apt.client.name} - ${apt.title}`);
        } catch (error) {
          this.logger.error(`❌ Error enviando recordatorio cita ID ${apt.id}:`, error.message);
        }
      }

      this.logger.log(`🎯 Proceso completado: ${appointments.length} recordatorios procesados`);
    } catch (error) {
      this.logger.error('❌ Error general en recordatorios de citas:', error.message);
    }
  }

  // === RECORDATORIOS 2 HORAS ANTES ===
  @Cron('*/30 * * * *') // Cada 30 minutos
  async sendUrgentReminders() {
    if (process.env.ENABLE_URGENT_REMINDERS !== 'true') return;

    const now = new Date();
    const twoHoursFromNow = addMinutes(now, 120);
    const twoHoursThirtyFromNow = addMinutes(now, 150);

    try {
      const upcomingAppointments = await this.appointmentRepo.find({
        where: {
          startDateTime: Between(twoHoursFromNow, twoHoursThirtyFromNow),
          status: AppointmentStatus.CONFIRMED
        },
        relations: ['client', 'professional']
      });

      for (const apt of upcomingAppointments) {
        try {
          if (!apt.client?.email) continue;

          await this.emailService.sendTemplateEmail({
            to: [apt.client.email],
            templateId: 'appointment-urgent-reminder',
            templateVariables: {
              clientName: apt.client.name,
              appointmentTime: format(apt.startDateTime, 'HH:mm'),
              professionalName: apt.professional?.name || 'Profesional',
              service: apt.title,
              address: process.env.CLINIC_ADDRESS || 'Dirección de la clínica'
            }
          });

          // Notificación interna también
          await this.notificationService.create(
            'Recordatorio Urgente Enviado',
            `Recordatorio 2h enviado a ${apt.client.name} para ${apt.title}`,
            apt.professional?.id || 1
          );

          // Usar reminderSentAt para ambos tipos de recordatorio
          await this.appointmentRepo.save(apt);

          this.logger.log(`⚡ Recordatorio urgente enviado: ${apt.client.name}`);
        } catch (error) {
          this.logger.error(`❌ Error recordatorio urgente cita ID ${apt.id}:`, error.message);
        }
      }
    } catch (error) {
      this.logger.error('❌ Error en recordatorios urgentes:', error.message);
    }
  }

  // === EMAIL DE BIENVENIDA ===
  async sendWelcomeEmail(userId: number): Promise<boolean> {
    try {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user?.email) {
        this.logger.warn(`Usuario no encontrado o sin email: ${userId}`);
        return false;
      }

      await this.emailService.sendTemplateEmail({
        to: [user.email],
        templateId: 'welcome',
        templateVariables: {
          firstName: user.name,
          lastName: user.lastName || '',
          loginLink: `${process.env.FRONTEND_URL}/login`,
          supportEmail: process.env.SUPPORT_EMAIL || 'soporte@orbyt.com',
          clinicName: process.env.CLINIC_NAME || 'Orbyt',
          setupProfileLink: `${process.env.FRONTEND_URL}/profile/setup`
        }
      });

      this.logger.log(`👋 Email de bienvenida enviado a: ${user.email}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Error enviando email bienvenida usuario ${userId}:`, error.message);
      return false;
    }
  }

  // === RESET DE CONTRASEÑA ===
  async sendPasswordResetEmail(userId: number, resetToken: string): Promise<boolean> {
    try {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user?.email) {
        this.logger.warn(`Usuario no encontrado para reset: ${userId}`);
        return false;
      }

      await this.emailService.sendTemplateEmail({
        to: [user.email],
        templateId: 'password-reset',
        templateVariables: {
          firstName: user.name,
          resetLink: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
          expirationTime: '24 horas',
          supportEmail: process.env.SUPPORT_EMAIL || 'soporte@orbyt.com',
          securityTip: 'Si no solicitaste este cambio, ignora este email'
        }
      });

      this.logger.log(`🔑 Email reset contraseña enviado a: ${user.email}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Error enviando reset password usuario ${userId}:`, error.message);
      return false;
    }
  }

  // === PROMOCIONES SEMANALES - Viernes 6 PM ===
  @Cron('0 18 * * 5')
  async sendWeeklyPromotions() {
    if (process.env.ENABLE_WEEKLY_PROMOTIONS !== 'true') {
      this.logger.debug('Promociones semanales deshabilitadas');
      return;
    }

    this.logger.log('🎉 Enviando promociones semanales...');
    
    try {
      const activeClients = await this.clientRepo.find({
        // Buscar clientes con email válido
      });

      this.logger.log(`👥 Clientes activos para promociones: ${activeClients.length}`);

      // Envío masivo
      const recipients = activeClients
        .filter(client => client.email) // Solo con email válido
        .map(client => ({
          email: client.email,
          variables: {
            clientName: client.name,
            weekendOffer: '20% descuento',
            validUntil: format(addDays(new Date(), 7), 'dd/MM/yyyy'),
            servicesIncluded: 'Todos los servicios de belleza',
            bookingLink: `${process.env.FRONTEND_URL}/book-appointment`,
            unsubscribeLink: `${process.env.FRONTEND_URL}/unsubscribe/${client.id}`
          }
        }));

      if (recipients.length > 0) {
        await this.emailService.sendBulkEmails({
          templateId: 'weekly-promotions',
          recipients,
          scheduleDelivery: false
        });

        this.logger.log(`📧 Promociones enviadas a ${recipients.length} clientes`);
      }
    } catch (error) {
      this.logger.error('❌ Error en promociones semanales:', error.message);
    }
  }

  // === REACTIVAR CLIENTES INACTIVOS - Primer día del mes 10 AM ===
  @Cron('0 10 1 * *')
  async reactivateInactiveClients() {
    if (process.env.ENABLE_REACTIVATION_CAMPAIGNS !== 'true') {
      this.logger.debug('Campañas de reactivación deshabilitadas');
      return;
    }

    this.logger.log('🔄 Iniciando campaña reactivación clientes...');
    const twoMonthsAgo = subMonths(new Date(), 2);
    
    try {
      // Buscar clientes que no han tenido citas en 2 meses
      const inactiveClientIds = await this.appointmentRepo
        .createQueryBuilder('apt')
        .select('DISTINCT apt.clientId')
        .where('apt.startDateTime < :date', { date: twoMonthsAgo })
        .getRawMany();

      const recentActiveClientIds = await this.appointmentRepo
        .createQueryBuilder('apt')
        .select('DISTINCT apt.clientId')
        .where('apt.startDateTime >= :date', { date: twoMonthsAgo })
        .getRawMany();

      // Clientes inactivos = que tuvieron citas antes de 2 meses PERO NO después
      const trulyInactiveIds = inactiveClientIds
        .filter(inactive => !recentActiveClientIds.some(active => active.clientId === inactive.clientId))
        .map(item => item.clientId);

      if (trulyInactiveIds.length === 0) {
        this.logger.log('😊 No hay clientes inactivos para reactivar');
        return;
      }

      const inactiveClients = await this.clientRepo.find({
        where: trulyInactiveIds.length > 0 ? { id: In(trulyInactiveIds) } : { id: -1 } // No results if empty
      });

      this.logger.log(`😴 Clientes inactivos encontrados: ${inactiveClients.length}`);

      for (const client of inactiveClients) {
        try {
          if (!client.email) continue;

          await this.emailService.sendTemplateEmail({
            to: [client.email],
            templateId: 'reactivation-offer',
            templateVariables: {
              clientName: client.name,
              discountPercent: 25,
              validUntil: format(addDays(new Date(), 30), 'dd/MM/yyyy'),
              specialMessage: 'Te echamos de menos 💕',
              bookingLink: `${process.env.FRONTEND_URL}/book-appointment?promo=COMEBACK25`,
              servicesHighlight: 'Nuevos tratamientos disponibles'
            }
          });

          this.logger.log(`💌 Oferta reactivación enviada a: ${client.name}`);
        } catch (error) {
          this.logger.error(`❌ Error reactivación cliente ${client.id}:`, error.message);
        }
      }
    } catch (error) {
      this.logger.error('❌ Error en campaña reactivación:', error.message);
    }
  }

  // === CONFIRMACIÓN AUTOMÁTICA DE CITA ===
  async sendAppointmentConfirmation(appointmentId: number): Promise<boolean> {
    try {
      const apt = await this.appointmentRepo.findOne({
        where: { id: appointmentId },
        relations: ['client', 'professional']
      });

      if (!apt) {
        this.logger.warn(`Cita no encontrada: ${appointmentId}`);
        return false;
      }

      if (!apt.client?.email) {
        this.logger.warn(`Cliente sin email para cita: ${appointmentId}`);
        return false;
      }

      await this.emailService.sendTemplateEmail({
        to: [apt.client.email],
        templateId: 'appointment-confirmation',
        templateVariables: {
          clientName: apt.client.name,
          appointmentDate: format(apt.startDateTime, 'dd/MM/yyyy'),
          appointmentTime: format(apt.startDateTime, 'HH:mm'),
          professionalName: apt.professional?.name || 'Profesional',
          service: apt.title,
          duration: '60 minutos', // Default duration
          clinicName: process.env.CLINIC_NAME || 'Nuestra Clínica',
          address: process.env.CLINIC_ADDRESS || 'Dirección no configurada',
          phone: process.env.CLINIC_PHONE || 'Teléfono no configurado',
          cancelLink: `${process.env.FRONTEND_URL}/cancel-appointment/${apt.id}`,
          rescheduleLink: `${process.env.FRONTEND_URL}/reschedule-appointment/${apt.id}`,
          preparationInstructions: 'Llega 10 minutos antes de tu cita'
        }
      });

      // Notificación interna al profesional
      if (apt.professional?.id) {
        await this.notificationService.create(
          'Confirmación Enviada',
          `Confirmación enviada a ${apt.client.name} para ${apt.title}`,
          apt.professional.id
        );
      }

      this.logger.log(`✅ Confirmación enviada para cita: ${apt.id} - ${apt.client.name}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Error confirmación cita ${appointmentId}:`, error.message);
      return false;
    }
  }

  // === CANCELACIÓN DE CITA ===
  async sendAppointmentCancellation(appointmentId: number, reason?: string): Promise<boolean> {
    try {
      const apt = await this.appointmentRepo.findOne({
        where: { id: appointmentId },
        relations: ['client', 'professional']
      });

      if (!apt || !apt.client?.email) return false;

      await this.emailService.sendTemplateEmail({
        to: [apt.client.email],
        templateId: 'appointment-cancellation',
        templateVariables: {
          clientName: apt.client.name,
          appointmentDate: format(apt.startDateTime, 'dd/MM/yyyy'),
          appointmentTime: format(apt.startDateTime, 'HH:mm'),
          service: apt.title,
          cancellationReason: reason || 'No especificado',
          rebookLink: `${process.env.FRONTEND_URL}/book-appointment`,
          supportPhone: process.env.CLINIC_PHONE || 'Contactar clínica'
        }
      });

      this.logger.log(`❌ Cancelación notificada: ${apt.client.name} - ${apt.title}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Error cancelación cita ${appointmentId}:`, error.message);
      return false;
    }
  }

  // === NOTIFICACIONES DE CUMPLEAÑOS - Diario 8 AM ===
  @Cron('0 8 * * *')
  async sendBirthdayWishes() {
    if (process.env.ENABLE_BIRTHDAY_WISHES !== 'true') return;

    try {
      const today = new Date();
      const birthdayClients = await this.clientRepo
        .createQueryBuilder('client')
        .where('MONTH(client.birthDate) = :month', { month: today.getMonth() + 1 })
        .andWhere('DAY(client.birthDate) = :day', { day: today.getDate() })
        .andWhere('client.isActive = true')
        .getMany();

      for (const client of birthdayClients) {
        if (!client.email) continue;

        await this.emailService.sendTemplateEmail({
          to: [client.email],
          templateId: 'birthday-wishes',
          templateVariables: {
            clientName: client.name,
            birthdayOffer: '30% descuento',
            validUntil: format(addDays(new Date(), 7), 'dd/MM/yyyy'),
            bookingLink: `${process.env.FRONTEND_URL}/book-appointment?promo=BIRTHDAY30`
          }
        });

        this.logger.log(`🎂 Felicitaciones enviadas a: ${client.name}`);
      }
    } catch (error) {
      this.logger.error('❌ Error en cumpleaños:', error.message);
    }
  }

  // === MÉTODO DE TESTING MANUAL ===
  async testNotificationSystem(): Promise<object> {
    const results = {
      emailService: false,
      notificationService: false,
      databaseConnections: false,
      templates: []
    };

    try {
      // Test email service
      const testConnection = await this.emailService.testSmtpConnection();
      results.emailService = testConnection.success;

      // Test notification service
      const testUser = await this.userRepo.findOne({ where: {} });
      if (testUser) {
        await this.notificationService.create('Test', 'Sistema funcionando', testUser.id);
        results.notificationService = true;
      }

      // Test database
      const userCount = await this.userRepo.count();
      const clientCount = await this.clientRepo.count();
      results.databaseConnections = userCount >= 0 && clientCount >= 0;

      this.logger.log('🧪 Test del sistema completado:', results);
      return results;
    } catch (error) {
      this.logger.error('❌ Error en test del sistema:', error.message);
      return results;
    }
  }
}