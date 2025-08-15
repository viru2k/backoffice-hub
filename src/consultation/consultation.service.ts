import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Consultation } from './entities/consultation.entity';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';
import { FileUpload } from '../upload/entities/file-upload.entity';
import { NotificationGateway } from '../notification/notification.gateway';
import { EmailService } from '../email/email.service';

@Injectable()
export class ConsultationService {
  constructor(
    @InjectRepository(Consultation)
    private readonly consultationRepo: Repository<Consultation>,
    @InjectRepository(FileUpload)
    private readonly fileRepo: Repository<FileUpload>,
    private readonly notificationGateway: NotificationGateway,
    private readonly emailService: EmailService,
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
    page: number = 1,
    limit: number = 10,
    status?: string,
    clientId?: number,
  ): Promise<{ data: Consultation[]; total: number; page: number; limit: number }> {
    const query = this.consultationRepo
      .createQueryBuilder('consultation')
      .leftJoinAndSelect('consultation.client', 'client')
      .leftJoinAndSelect('consultation.user', 'user')
      .leftJoinAndSelect('consultation.appointment', 'appointment')
      .where('consultation.userId = :userId', { userId });

    if (status) {
      query.andWhere('consultation.status = :status', { status });
    }

    if (clientId) {
      query.andWhere('consultation.clientId = :clientId', { clientId });
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
        'appointment',
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
        entityType: 'consultation',
        entityId: id,
        userId,
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
      relations: ['user', 'invoices', 'files'],
      order: { createdAt: 'DESC' },
    });
  }

  async attachFile(consultationId: number, fileId: number, userId: number): Promise<void> {
    const consultation = await this.findOne(consultationId, userId);
    
    const file = await this.fileRepo.findOne({
      where: { id: fileId, userId },
    });

    if (!file) {
      throw new NotFoundException('Archivo no encontrado');
    }

    // Actualizar la relación del archivo
    await this.fileRepo.update(fileId, {
      entityType: 'consultation',
      entityId: consultationId,
    });
  }

  async getStats(userId: number): Promise<any> {
    const stats = await this.consultationRepo
      .createQueryBuilder('consultation')
      .select([
        'COUNT(*) as total',
        'SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) as pending',
        'SUM(CASE WHEN status = "in_progress" THEN 1 ELSE 0 END) as inProgress',
        'SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed',
        'SUM(CASE WHEN status = "cancelled" THEN 1 ELSE 0 END) as cancelled',
      ])
      .where('consultation.userId = :userId', { userId })
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

    return this.consultationRepo.find({
      where: {
        userId,
        createdAt: {
          $gte: today,
          $lt: tomorrow,
        } as any,
      },
      relations: ['client', 'appointment'],
      order: { startTime: 'ASC' },
    });
  }
}