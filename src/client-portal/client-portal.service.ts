import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client, ClientStatus } from '../client/entities/client.entity';
import { ClientProfileUpdateDto, ClientPasswordUpdateDto } from './dto/client-profile-update.dto';
import { ClientProfileResponseDto } from './dto/client-profile-response.dto';
import { ClientAppointmentResponseDto, ClientAppointmentsListDto } from './dto/client-appointments-response.dto';
import { ClientRewardsSummaryDto, ClientRewardProgressDto, ClientAvailableRewardDto } from './dto/client-rewards-response.dto';
import { ClientCompleteHistoryDto } from './dto/client-history-response.dto';
import { Appointment } from '../agenda/entities/appointment.entity';
import { CustomerReward, CustomerRewardStatus } from '../rewards/entities/customer-reward.entity';
import { RewardProgram, RewardProgramStatus } from '../rewards/entities/reward-program.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class ClientPortalService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(CustomerReward)
    private readonly customerRewardRepository: Repository<CustomerReward>,
    @InjectRepository(RewardProgram)
    private readonly rewardProgramRepository: Repository<RewardProgram>,
  ) {}

  async getClientProfile(clientId: number): Promise<ClientProfileResponseDto> {
    const client = await this.clientRepository.findOne({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }

    if (!client.hasPortalAccess) {
      throw new ForbiddenException('No tiene acceso al portal de clientes');
    }

    return this.mapToProfileResponse(client);
  }

  async updateClientProfile(clientId: number, updateData: ClientProfileUpdateDto): Promise<ClientProfileResponseDto> {
    const client = await this.clientRepository.findOne({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }

    if (!client.hasPortalAccess) {
      throw new ForbiddenException('No tiene acceso al portal de clientes');
    }

    // VALIDAR QUE NO SE INTENTEN MODIFICAR CAMPOS PROTEGIDOS
    this.validateEditableFields(updateData);

    // ACTUALIZAR SOLO CAMPOS PERMITIDOS
    const allowedUpdates: Partial<Client> = {};
    
    if (updateData.preferredName !== undefined) {
      allowedUpdates.preferredName = updateData.preferredName;
    }
    
    if (updateData.address !== undefined) {
      allowedUpdates.address = updateData.address;
    }
    
    if (updateData.gender !== undefined) {
      allowedUpdates.gender = updateData.gender;
    }
    
    if (updateData.birthDate !== undefined) {
      allowedUpdates.birthDate = updateData.birthDate;
    }
    
    if (updateData.personalNotes !== undefined) {
      allowedUpdates.personalNotes = updateData.personalNotes;
    }
    
    if (updateData.avatarUrl !== undefined) {
      allowedUpdates.avatarUrl = updateData.avatarUrl;
    }

    // APLICAR ACTUALIZACIONES
    await this.clientRepository.update(clientId, allowedUpdates);
    
    // OBTENER CLIENTE ACTUALIZADO
    const updatedClient = await this.clientRepository.findOne({
      where: { id: clientId },
    });

    return this.mapToProfileResponse(updatedClient!);
  }

  async updatePassword(clientId: number, passwordData: ClientPasswordUpdateDto): Promise<void> {
    const client = await this.clientRepository.findOne({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }

    if (!client.hasPortalAccess || !client.password) {
      throw new ForbiddenException('No tiene acceso al portal de clientes');
    }

    // VERIFICAR CONTRASEÑA ACTUAL
    const isCurrentPasswordValid = await bcrypt.compare(
      passwordData.currentPassword, 
      client.password
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    // HASHEAR NUEVA CONTRASEÑA
    const hashedNewPassword = await bcrypt.hash(passwordData.newPassword, 10);

    // ACTUALIZAR CONTRASEÑA
    await this.clientRepository.update(clientId, {
      password: hashedNewPassword,
    });
  }

  /**
   * Mapea la entidad Client a ClientProfileResponseDto
   */
  private mapToProfileResponse(client: Client): ClientProfileResponseDto {
    return {
      id: client.id,
      name: client.name,
      lastName: client.lastName,
      fullname: client.fullname,
      email: client.email,
      phone: client.phone,
      membershipNumber: client.membershipNumber,
      status: client.status,
      preferredName: client.preferredName,
      address: client.address,
      gender: client.gender,
      birthDate: client.birthDate,
      personalNotes: client.personalNotes,
      avatarUrl: client.avatarUrl,
      hasPortalAccess: client.hasPortalAccess,
      lastLogin: client.lastLogin,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    };
  }

  /**
   * Valida que no se intenten editar campos protegidos
   */
  private validateEditableFields(updateData: any): void {
    const protectedFields = [
      'id', 'name', 'lastName', 'fullname', 'email', 'phone', 
      'membershipNumber', 'status', 'adminNotes', 'hasPortalAccess',
      'password', 'createdAt', 'updatedAt', 'owner', 'user'
    ];

    const attemptedFields = Object.keys(updateData);
    const violatedFields = attemptedFields.filter(field => 
      protectedFields.includes(field)
    );

    if (violatedFields.length > 0) {
      throw new ForbiddenException(
        `No puede modificar los siguientes campos: ${violatedFields.join(', ')}`
      );
    }
  }

  /**
   * Obtiene el nombre a mostrar (preferido o registrado)
   */
  getDisplayName(client: Client): string {
    if (client.preferredName?.trim()) {
      return client.preferredName;
    }
    
    return client.fullname || `${client.name} ${client.lastName || ''}`.trim();
  }

  // === MÉTODOS DE CONSULTA (SOLO LECTURA) ===

  async getClientAppointments(
    clientId: number, 
    page: number = 1, 
    limit: number = 10
  ): Promise<ClientAppointmentsListDto> {
    await this.validateClientAccess(clientId);

    const [appointments, total] = await this.appointmentRepository.findAndCount({
      where: { client: { id: clientId } },
      relations: ['professional', 'service'],
      order: { startDateTime: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const appointmentDtos: ClientAppointmentResponseDto[] = appointments.map(appointment => ({
      id: appointment.id,
      appointmentDate: appointment.startDateTime,
      serviceType: appointment.service?.name || appointment.title,
      status: appointment.status,
      notes: appointment.notes,
      durationMinutes: appointment.endDateTime ? 
        Math.round((appointment.endDateTime.getTime() - appointment.startDateTime.getTime()) / (1000 * 60)) : 
        undefined,
      professional: appointment.professional ? {
        id: appointment.professional.id,
        name: appointment.professional.name,
        email: appointment.professional.email,
      } : undefined,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    }));

    return {
      appointments: appointmentDtos,
      total,
      page,
      limit,
    };
  }

  async getClientRewards(clientId: number): Promise<ClientRewardsSummaryDto> {
    await this.validateClientAccess(clientId);

    // Obtener todas las recompensas del cliente
    const customerRewards = await this.customerRewardRepository.find({
      where: { client: { id: clientId } },
      relations: ['rewardProgram'],
      order: { createdAt: 'DESC' },
    });

    // Obtener todos los programas activos
    const activePrograms = await this.rewardProgramRepository.find({
      where: { status: RewardProgramStatus.ACTIVE },
    });

    const inProgress: ClientRewardProgressDto[] = [];
    const availableRewards: ClientAvailableRewardDto[] = [];

    // Procesar recompensas del cliente
    for (const customerReward of customerRewards) {
      const program = customerReward.rewardProgram;
      
      if (customerReward.status === CustomerRewardStatus.EARNED && !customerReward.redeemedAt) {
        // Recompensa lista para canjear
        availableRewards.push({
          rewardId: customerReward.id,
          programId: program.id,
          programName: program.name,
          description: program.description,
          rewardType: program.rewardType,
          rewardValue: program.rewardValue,
          completedAt: customerReward.earnedAt!,
          expiresAt: customerReward.expiresAt || undefined,
          daysToExpire: customerReward.expiresAt ? 
            Math.ceil((customerReward.expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 
            undefined,
        });
      } else if (customerReward.status === CustomerRewardStatus.IN_PROGRESS) {
        // Recompensa en progreso
        const progressPercentage = Math.min(100, (customerReward.currentProgress / program.conditionValue) * 100);
        
        inProgress.push({
          programId: program.id,
          programName: program.name,
          description: program.description,
          conditionType: program.conditionType,
          targetValue: program.conditionValue,
          currentValue: customerReward.currentProgress,
          progressPercentage: Math.round(progressPercentage),
          isCompleted: false, // En progreso nunca está completado
          validUntil: program.validUntil || undefined,
          rewardType: program.rewardType,
          rewardValue: program.rewardValue,
        });
      }
    }

    // Historial simplificado (últimas 20 acciones)
    const history = customerRewards
      .slice(0, 20)
      .map(reward => ({
        id: reward.id,
        programName: reward.rewardProgram.name,
        action: this.getActionDescription(reward.status, reward.redeemedAt),
        description: `${reward.rewardProgram.description}`,
        date: reward.redeemedAt || reward.earnedAt || reward.createdAt,
        value: reward.currentProgress,
      }));

    // Estadísticas
    const stats = {
      totalProgramsActive: inProgress.length,
      totalRewardsEarned: customerRewards.filter(r => r.status === CustomerRewardStatus.EARNED).length,
      totalRewardsRedeemed: customerRewards.filter(r => r.redeemedAt).length,
      totalRewardsExpired: customerRewards.filter(r => r.status === CustomerRewardStatus.EXPIRED).length,
    };

    return {
      inProgress,
      availableRewards,
      history,
      stats,
    };
  }

  async getClientHistory(
    clientId: number, 
    page: number = 1, 
    limit: number = 10
  ): Promise<ClientCompleteHistoryDto> {
    await this.validateClientAccess(clientId);

    // Por ahora retornamos estructura básica
    // Esto se puede extender cuando tengas entidades de Service e Invoice
    const services: any[] = [];
    const invoices: any[] = [];

    const stats = {
      totalServices: services.length,
      totalSpent: invoices.reduce((sum, inv) => sum + inv.total, 0),
      averageServiceCost: 0,
      lastServiceDate: undefined,
      favoriteServiceType: undefined,
      totalVisits: services.length,
    };

    return {
      services,
      invoices,
      stats,
      pagination: {
        page,
        limit,
        total: services.length + invoices.length,
      },
    };
  }

  // === MÉTODOS AUXILIARES ===

  private async validateClientAccess(clientId: number): Promise<void> {
    const client = await this.clientRepository.findOne({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }

    if (!client.hasPortalAccess) {
      throw new ForbiddenException('No tiene acceso al portal de clientes');
    }
  }

  private getActionDescription(status: CustomerRewardStatus, redeemedAt?: Date): string {
    if (redeemedAt) return 'Recompensa canjeada';
    if (status === CustomerRewardStatus.EARNED) return 'Recompensa completada';
    if (status === CustomerRewardStatus.IN_PROGRESS) return 'Progreso actualizado';
    if (status === CustomerRewardStatus.EXPIRED) return 'Recompensa expirada';
    return 'Acción registrada';
  }
}