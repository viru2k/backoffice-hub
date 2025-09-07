import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Consultation } from './entities/consultation.entity';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';
import { ConsultationFiltersDto } from './dto/consultation-filters.dto';
import { FileUpload, EntityType } from '../upload/entities/file-upload.entity';
import { NotificationGateway } from '../notification/notification.gateway';
import { EmailService } from '../email/email.service';
import { RewardsService } from '../rewards/rewards.service';

@Injectable()
export class ConsultationService {
  constructor(
    @InjectRepository(Consultation)
    private readonly consultationRepo: Repository<Consultation>,
    @InjectRepository(FileUpload)
    private readonly fileRepo: Repository<FileUpload>,
    private readonly notificationGateway: NotificationGateway,
    private readonly emailService: EmailService,
    private readonly rewardsService: RewardsService,
  ) {}

  private generateConsultationNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `CONS-${timestamp}-${random}`;
  }

  async create(createDto: CreateConsultationDto, userId: number): Promise<Consultation> {
    const consultationNumber = this.generateConsultationNumber();

    const consultation = this.consultationRepo.create({
      ...createDto,
      userId,
      consultationNumber,
      startTime: createDto.startTime ? new Date(createDto.startTime) : null,
      endTime: createDto.endTime ? new Date(createDto.endTime) : null,
      nextAppointment: createDto.nextAppointment ? new Date(createDto.nextAppointment) : null,
      followUpDate: createDto.followUpDate ? new Date(createDto.followUpDate) : null,
    });

    const savedConsultation = await this.consultationRepo.save(consultation);

    // Notificar por WebSocket
    await this.notificationGateway.sendNotificationToUser(userId, {
      type: 'consultation_created',
      title: 'Nueva Consulta Creada',
      message: `Consulta ${consultationNumber} creada exitosamente`,
      data: { consultationId: savedConsultation.id },
      timestamp: new Date().toISOString(),
    });

    return this.findOne(savedConsultation.id, userId);
  }

  async findAll(
    userId: number,
    filters: ConsultationFiltersDto = {},
  ): Promise<{ data: Consultation[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10, clientId, status, date, today, fromDate, toDate, consultationTypeId, clientName } = filters;

    const query = this.consultationRepo
      .createQueryBuilder('consultation')
      .leftJoinAndSelect('consultation.client', 'client')
      .leftJoinAndSelect('consultation.user', 'user')
      .leftJoinAndSelect('consultation.appointment', 'appointment')
      .leftJoinAndSelect('consultation.consultationType', 'consultationType')
      .leftJoinAndSelect('consultationType.businessType', 'businessType')
      .where('consultation.userId = :userId', { userId });

    // Filtros
    if (status) {
      query.andWhere('consultation.status = :status', { status });
    }

    if (clientId) {
      query.andWhere('consultation.clientId = :clientId', { clientId });
    }

    if (consultationTypeId) {
      query.andWhere('consultation.consultationTypeId = :consultationTypeId', { consultationTypeId });
    }

    if (clientName) {
      query.andWhere('client.fullname LIKE :clientName', { clientName: `%${clientName}%` });
    }

    // Filtros de fecha
    if (today) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      query.andWhere('consultation.createdAt BETWEEN :startOfDay AND :endOfDay', { startOfDay, endOfDay });
    } else if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      query.andWhere('consultation.createdAt BETWEEN :startOfDay AND :endOfDay', { startOfDay, endOfDay });
    } else if (fromDate && toDate) {
      const startDate = new Date(fromDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);
      query.andWhere('consultation.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });
    } else if (fromDate) {
      const startDate = new Date(fromDate);
      startDate.setHours(0, 0, 0, 0);
      query.andWhere('consultation.createdAt >= :startDate', { startDate });
    } else if (toDate) {
      const endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);
      query.andWhere('consultation.createdAt <= :endDate', { endDate });
    }

    query
      .orderBy('consultation.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await query.getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: number, userId: number): Promise<Consultation> {
    const consultation = await this.consultationRepo.findOne({
      where: { id, userId },
      relations: [
        'client',
        'user',
        'invoices',
        'files',
      ],
    });

    if (!consultation) {
      throw new NotFoundException('Consulta no encontrada');
    }

    // Cargar archivos asociados
    const files = await this.fileRepo.find({
      where: {
        entityType: EntityType.CONSULTATION,
        entityId: id,
      },
    });

    consultation.files = files;

    return consultation;
  }

  async update(id: number, updateDto: UpdateConsultationDto, userId: number): Promise<Consultation> {
    const consultation = await this.findOne(id, userId);

    // Convertir fechas string a Date objects
    const updateData = {
      ...updateDto,
      startTime: updateDto.startTime ? new Date(updateDto.startTime) : consultation.startTime,
      endTime: updateDto.endTime ? new Date(updateDto.endTime) : consultation.endTime,
      nextAppointment: updateDto.nextAppointment ? new Date(updateDto.nextAppointment) : consultation.nextAppointment,
      followUpDate: updateDto.followUpDate ? new Date(updateDto.followUpDate) : consultation.followUpDate,
    };

    await this.consultationRepo.update(id, updateData);

    // Notificar cambios importantes
    if (updateDto.status && updateDto.status !== consultation.status) {
      await this.notificationGateway.sendNotificationToUser(userId, {
        type: 'consultation_updated',
        title: 'Consulta Actualizada',
        message: `Consulta ${consultation.consultationNumber} cambió a estado: ${updateDto.status}`,
        data: { consultationId: id, newStatus: updateDto.status },
        timestamp: new Date().toISOString(),
      });
    }

    return this.findOne(id, userId);
  }

  async updateStatus(id: number, status: string, userId: number): Promise<Consultation> {
    const consultation = await this.findOne(id, userId);

    await this.consultationRepo.update(id, { 
      status: status as any,
      endTime: status === 'completed' ? new Date() : consultation.endTime,
    });

    // Notificar cambio de estado
    await this.notificationGateway.sendNotificationToUser(userId, {
      type: 'consultation_status_changed',
      title: 'Estado de Consulta Actualizado',
      message: `Consulta ${consultation.consultationNumber} marcada como: ${status}`,
      data: { consultationId: id, status },
      timestamp: new Date().toISOString(),
    });

    // Integración con sistema de recompensas cuando se completa la consulta
    if (status === 'completed') {
      try {
        await this.rewardsService.onConsultationCompleted(consultation.clientId);
      } catch (error) {
        console.error('Error updating rewards for consultation completion:', error);
      }
    }

    return this.findOne(id, userId);
  }

  async delete(id: number, userId: number): Promise<void> {
    const consultation = await this.findOne(id, userId);

    if (consultation.status === 'completed') {
      throw new BadRequestException('No se puede eliminar una consulta completada');
    }

    await this.consultationRepo.delete(id);
  }

  async getClientHistory(clientId: number, userId: number): Promise<Consultation[]> {
    return this.consultationRepo.find({
      where: { clientId, userId },
      relations: ['client', 'user', 'invoices', 'files'],
      order: { createdAt: 'DESC' },
    });
  }

  async attachFile(consultationId: number, fileId: number, userId: number): Promise<void> {
    const consultation = await this.findOne(consultationId, userId);
    
    const file = await this.fileRepo.findOne({
      where: { id: fileId },
      relations: ['uploadedBy'],
    });

    if (!file) {
      throw new NotFoundException('Archivo no encontrado');
    }

    // Actualizar la relación del archivo
    await this.fileRepo.update(fileId, {
      entityType: EntityType.CONSULTATION,
      entityId: consultationId,
    });
  }

  async getStats(userId: number): Promise<any> {
    const stats = await this.consultationRepo
      .createQueryBuilder('consultation')
      .select([
        'COUNT(*) as total',
        'SUM(CASE WHEN consultation.status = :pending THEN 1 ELSE 0 END) as pending',
        'SUM(CASE WHEN consultation.status = :inProgress THEN 1 ELSE 0 END) as inProgress',
        'SUM(CASE WHEN consultation.status = :completed THEN 1 ELSE 0 END) as completed',
        'SUM(CASE WHEN consultation.status = :cancelled THEN 1 ELSE 0 END) as cancelled',
      ])
      .where('consultation.userId = :userId', { userId })
      .setParameters({
        pending: 'pending',
        inProgress: 'in_progress',
        completed: 'completed',
        cancelled: 'cancelled',
      })
      .getRawOne();

    return {
      total: parseInt(stats.total) || 0,
      pending: parseInt(stats.pending) || 0,
      inProgress: parseInt(stats.inProgress) || 0,
      completed: parseInt(stats.completed) || 0,
      cancelled: parseInt(stats.cancelled) || 0,
    };
  }

  async getTodayConsultations(userId: number): Promise<Consultation[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.consultationRepo
      .createQueryBuilder('consultation')
      .leftJoinAndSelect('consultation.client', 'client')
      .leftJoinAndSelect('consultation.user', 'user')
      .where('consultation.userId = :userId', { userId })
      .andWhere('consultation.createdAt >= :today', { today })
      .andWhere('consultation.createdAt < :tomorrow', { tomorrow })
      .orderBy('consultation.startTime', 'ASC')
      .getMany();
  }
}