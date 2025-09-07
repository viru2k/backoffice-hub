import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../agenda/entities/appointment.entity';
import { Consultation } from '../consultation/entities/consultation.entity';
import { Client, ClientStatus } from '../client/entities/client.entity';
import { Invoice } from '../invoice/entities/invoice.entity';
import { BusinessType } from '../business-type/entities/business-type.entity';
import { ConsultationType } from '../business-type/entities/consultation-type.entity';
import {
  DashboardMetricsDto,
  AppointmentMetricsDto,
  ConsultationMetricsDto,
  ClientMetricsDto,
  RevenueMetricsDto,
  BusinessTypeMetricsDto,
} from './dto/dashboard-metrics.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(Consultation)
    private readonly consultationRepo: Repository<Consultation>,
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(BusinessType)
    private readonly businessTypeRepo: Repository<BusinessType>,
    @InjectRepository(ConsultationType)
    private readonly consultationTypeRepo: Repository<ConsultationType>,
  ) {}

  async getMetrics(userId: number): Promise<DashboardMetricsDto> {
    const [appointments, consultations, clients, revenue, businessTypes] = await Promise.all([
      this.getAppointmentMetrics(userId),
      this.getConsultationMetrics(userId),
      this.getClientMetrics(userId),
      this.getRevenueMetrics(userId),
      this.getBusinessTypeMetrics(userId),
    ]);

    return {
      appointments,
      consultations,
      clients,
      revenue,
      businessTypes,
      generatedAt: new Date(),
    };
  }

  private async getAppointmentMetrics(userId: number): Promise<AppointmentMetricsDto> {
    const baseQuery = this.appointmentRepo
      .createQueryBuilder('appointment')
      .where('appointment.professionalId = :userId', { userId });

    const [total, pending, confirmed, completed, cancelled, today, thisWeek, thisMonth] = await Promise.all([
      baseQuery.getCount(),
      baseQuery.clone().andWhere('appointment.status = :status', { status: 'pending' }).getCount(),
      baseQuery.clone().andWhere('appointment.status = :status', { status: 'confirmed' }).getCount(),
      baseQuery.clone().andWhere('appointment.status = :status', { status: 'completed' }).getCount(),
      baseQuery.clone().andWhere('appointment.status = :status', { status: 'cancelled' }).getCount(),
      this.getAppointmentsByPeriod(userId, 'today'),
      this.getAppointmentsByPeriod(userId, 'week'),
      this.getAppointmentsByPeriod(userId, 'month'),
    ]);

    return { total, pending, confirmed, completed, cancelled, today, thisWeek, thisMonth };
  }

  private async getConsultationMetrics(userId: number): Promise<ConsultationMetricsDto> {
    const baseQuery = this.consultationRepo
      .createQueryBuilder('consultation')
      .where('consultation.userId = :userId', { userId });

    const [total, pending, inProgress, completed, cancelled, today, thisWeek, thisMonth] = await Promise.all([
      baseQuery.getCount(),
      baseQuery.clone().andWhere('consultation.status = :status', { status: 'pending' }).getCount(),
      baseQuery.clone().andWhere('consultation.status = :status', { status: 'in_progress' }).getCount(),
      baseQuery.clone().andWhere('consultation.status = :status', { status: 'completed' }).getCount(),
      baseQuery.clone().andWhere('consultation.status = :status', { status: 'cancelled' }).getCount(),
      this.getConsultationsByPeriod(userId, 'today'),
      this.getConsultationsByPeriod(userId, 'week'),
      this.getConsultationsByPeriod(userId, 'month'),
    ]);

    return { total, pending, inProgress, completed, cancelled, today, thisWeek, thisMonth };
  }

  private async getClientMetrics(userId: number): Promise<ClientMetricsDto> {
    // Para simplicidad, vamos a contar todos los clientes por ahora
    // En el futuro, esto debería filtrar por el usuario propietario
    const [total, active, inactive, newThisMonth, newThisWeek] = await Promise.all([
      this.clientRepo.count(),
      this.clientRepo.count({ where: { status: ClientStatus.ACTIVE } }),
      this.clientRepo.count({ where: { status: ClientStatus.INACTIVE } }),
      this.getClientsByPeriod(userId, 'month'),
      this.getClientsByPeriod(userId, 'week'),
    ]);

    return { total, active, inactive, newThisMonth, newThisWeek };
  }

  private async getRevenueMetrics(userId: number): Promise<RevenueMetricsDto> {
    const baseQuery = this.invoiceRepo
      .createQueryBuilder('invoice')
      .leftJoin('invoice.consultation', 'consultation')
      .where('consultation.userId = :userId', { userId });

    const totalRevenueResult = await baseQuery
      .clone()
      .andWhere('invoice.status = :status', { status: 'paid' })
      .select('SUM(invoice.total)', 'total')
      .getRawOne();

    const todayRevenueResult = await this.getRevenueByPeriod(userId, 'today');
    const weekRevenueResult = await this.getRevenueByPeriod(userId, 'week');
    const monthRevenueResult = await this.getRevenueByPeriod(userId, 'month');

    const pendingPaymentsResult = await baseQuery
      .clone()
      .andWhere('invoice.status = :status', { status: 'pending' })
      .select('SUM(invoice.total)', 'total')
      .getRawOne();

    const overdueResult = await baseQuery
      .clone()
      .andWhere('invoice.status = :status', { status: 'overdue' })
      .select('SUM(invoice.total)', 'total')
      .getRawOne();

    return {
      totalRevenue: parseFloat(totalRevenueResult?.total) || 0,
      todayRevenue: todayRevenueResult,
      thisWeekRevenue: weekRevenueResult,
      thisMonthRevenue: monthRevenueResult,
      pendingPayments: parseFloat(pendingPaymentsResult?.total) || 0,
      overdue: parseFloat(overdueResult?.total) || 0,
    };
  }

  private async getBusinessTypeMetrics(userId: number): Promise<BusinessTypeMetricsDto[]> {
    const businessTypes = await this.businessTypeRepo.find({
      where: { isActive: true },
      relations: ['consultationTypes'],
    });

    const metrics = await Promise.all(
      businessTypes.map(async (businessType) => {
        const consultationTypeIds = businessType.consultationTypes.map(ct => ct.id);
        
        let consultationsCount = 0;
        let revenue = 0;

        if (consultationTypeIds.length > 0) {
          const consultationsResult = await this.consultationRepo
            .createQueryBuilder('consultation')
            .where('consultation.userId = :userId', { userId })
            .andWhere('consultation.consultationTypeId IN (:...typeIds)', { typeIds: consultationTypeIds })
            .getCount();

          consultationsCount = consultationsResult;

          const revenueResult = await this.invoiceRepo
            .createQueryBuilder('invoice')
            .leftJoin('invoice.consultation', 'consultation')
            .where('consultation.userId = :userId', { userId })
            .andWhere('consultation.consultationTypeId IN (:...typeIds)', { typeIds: consultationTypeIds })
            .andWhere('invoice.status = :status', { status: 'paid' })
            .select('SUM(invoice.total)', 'total')
            .getRawOne();

          revenue = parseFloat(revenueResult?.total) || 0;
        }

        // Para appointments, necesitamos una lógica diferente ya que no están directamente conectados a business types
        const appointmentsCount = await this.appointmentRepo
          .createQueryBuilder('appointment')
          .leftJoin('appointment.professional', 'professional')
          .where('professional.id = :userId', { userId })
          .getCount();

        return {
          businessTypeId: businessType.id,
          businessTypeName: businessType.name,
          consultationsCount,
          appointmentsCount: Math.floor(appointmentsCount / businessTypes.length), // Distribución simple
          revenue,
        };
      })
    );

    return metrics;
  }

  private async getAppointmentsByPeriod(userId: number, period: 'today' | 'week' | 'month'): Promise<number> {
    const { startDate, endDate } = this.getPeriodDates(period);

    const count = await this.appointmentRepo
      .createQueryBuilder('appointment')
      .where('appointment.professionalId = :userId', { userId })
      .andWhere('appointment.startDateTime BETWEEN :start AND :end', { start: startDate, end: endDate })
      .getCount();

    return count;
  }

  private async getConsultationsByPeriod(userId: number, period: 'today' | 'week' | 'month'): Promise<number> {
    const { startDate, endDate } = this.getPeriodDates(period);

    const count = await this.consultationRepo
      .createQueryBuilder('consultation')
      .where('consultation.userId = :userId', { userId })
      .andWhere('consultation.createdAt BETWEEN :start AND :end', { start: startDate, end: endDate })
      .getCount();

    return count;
  }

  private async getClientsByPeriod(userId: number, period: 'week' | 'month'): Promise<number> {
    const { startDate, endDate } = this.getPeriodDates(period);

    const count = await this.clientRepo
      .createQueryBuilder('client')
      .where('client.createdAt BETWEEN :start AND :end', { start: startDate, end: endDate })
      .getCount();

    return count;
  }

  private async getRevenueByPeriod(userId: number, period: 'today' | 'week' | 'month'): Promise<number> {
    const { startDate, endDate } = this.getPeriodDates(period);

    const result = await this.invoiceRepo
      .createQueryBuilder('invoice')
      .leftJoin('invoice.consultation', 'consultation')
      .where('consultation.userId = :userId', { userId })
      .andWhere('invoice.status = :status', { status: 'paid' })
      .andWhere('invoice.updatedAt BETWEEN :start AND :end', { start: startDate, end: endDate })
      .select('SUM(invoice.total)', 'total')
      .getRawOne();

    return parseFloat(result?.total) || 0;
  }

  private getPeriodDates(period: 'today' | 'week' | 'month'): { startDate: Date; endDate: Date } {
    const now = new Date();
    const endDate = new Date(now);
    let startDate: Date;

    switch (period) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        break;
    }

    return { startDate, endDate };
  }

  async getQuickStats(userId: number): Promise<any> {
    const [todayAppointments, todayConsultations, pendingAppointments, activeClients] = await Promise.all([
      this.getAppointmentsByPeriod(userId, 'today'),
      this.getConsultationsByPeriod(userId, 'today'),
      this.appointmentRepo
        .createQueryBuilder('appointment')
        .where('appointment.professionalId = :userId', { userId })
        .andWhere('appointment.status = :status', { status: 'pending' })
        .getCount(),
      this.clientRepo.count({ where: { status: ClientStatus.ACTIVE } }),
    ]);

    return {
      todayAppointments,
      todayConsultations,
      pendingAppointments,
      activeClients,
      generatedAt: new Date(),
    };
  }

  async getRecentActivity(userId: number, limit: number = 10): Promise<any[]> {
    const recentConsultations = await this.consultationRepo
      .createQueryBuilder('consultation')
      .leftJoinAndSelect('consultation.client', 'client')
      .leftJoinAndSelect('consultation.consultationType', 'consultationType')
      .where('consultation.userId = :userId', { userId })
      .orderBy('consultation.updatedAt', 'DESC')
      .limit(limit)
      .getMany();

    const recentAppointments = await this.appointmentRepo
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.client', 'client')
      .where('appointment.professionalId = :userId', { userId })
      .orderBy('appointment.updatedAt', 'DESC')
      .limit(limit)
      .getMany();

    const activities = [
      ...recentConsultations.map(c => ({
        type: 'consultation',
        id: c.id,
        title: `Consulta #${c.consultationNumber}`,
        client: c.client?.fullname,
        status: c.status,
        date: c.updatedAt,
        consultationType: c.consultationType?.name,
      })),
      ...recentAppointments.map(a => ({
        type: 'appointment',
        id: a.id,
        title: a.title,
        client: a.client?.fullname,
        status: a.status,
        date: a.updatedAt,
        startTime: a.startDateTime,
      })),
    ];

    return activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }
}