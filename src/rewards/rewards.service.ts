import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RewardProgram, RewardProgramStatus, RewardConditionType } from './entities/reward-program.entity';
import { CustomerReward, CustomerRewardStatus } from './entities/customer-reward.entity';
import { Client } from '../client/entities/client.entity';
import { CreateRewardProgramDto } from './dto/create-reward-program.dto';
import { UpdateRewardProgramDto } from './dto/update-reward-program.dto';
import { EmailService } from '../email/email.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class RewardsService {
  constructor(
    @InjectRepository(RewardProgram)
    private rewardProgramRepository: Repository<RewardProgram>,
    @InjectRepository(CustomerReward)
    private customerRewardRepository: Repository<CustomerReward>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    private emailService: EmailService,
    private notificationService: NotificationService,
  ) {}

  // Gestión de Programas de Recompensas
  async createRewardProgram(createRewardProgramDto: CreateRewardProgramDto): Promise<RewardProgram> {
    const rewardProgram = this.rewardProgramRepository.create(createRewardProgramDto);
    return await this.rewardProgramRepository.save(rewardProgram);
  }

  async getAllRewardPrograms(): Promise<RewardProgram[]> {
    return await this.rewardProgramRepository.find({
      relations: ['businessType'],
      order: { createdAt: 'DESC' },
    });
  }

  async getActiveRewardPrograms(): Promise<RewardProgram[]> {
    return await this.rewardProgramRepository.find({
      where: { status: RewardProgramStatus.ACTIVE },
      relations: ['businessType'],
    });
  }

  async getRewardProgramsByBusinessType(businessTypeId: number): Promise<RewardProgram[]> {
    return await this.rewardProgramRepository.find({
      where: { 
        businessType: { id: businessTypeId },
        status: RewardProgramStatus.ACTIVE 
      },
      relations: ['businessType'],
    });
  }

  async updateRewardProgram(id: number, updateRewardProgramDto: UpdateRewardProgramDto): Promise<RewardProgram> {
    const rewardProgram = await this.rewardProgramRepository.findOne({ where: { id } });
    if (!rewardProgram) {
      throw new NotFoundException(`Programa de recompensas con ID ${id} no encontrado`);
    }

    Object.assign(rewardProgram, updateRewardProgramDto);
    return await this.rewardProgramRepository.save(rewardProgram);
  }

  async deleteRewardProgram(id: number): Promise<void> {
    const result = await this.rewardProgramRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Programa de recompensas con ID ${id} no encontrado`);
    }
  }

  // Gestión de Recompensas de Cliente
  async getClientRewards(clientId: number): Promise<CustomerReward[]> {
    return await this.customerRewardRepository.find({
      where: { client: { id: clientId } },
      relations: ['rewardProgram', 'rewardProgram.businessType'],
      order: { createdAt: 'DESC' },
    });
  }

  async getClientActiveRewards(clientId: number): Promise<CustomerReward[]> {
    return await this.customerRewardRepository.find({
      where: { 
        client: { id: clientId },
        status: CustomerRewardStatus.IN_PROGRESS 
      },
      relations: ['rewardProgram', 'rewardProgram.businessType'],
    });
  }

  async getClientEarnedRewards(clientId: number): Promise<CustomerReward[]> {
    return await this.customerRewardRepository.find({
      where: { 
        client: { id: clientId },
        status: CustomerRewardStatus.EARNED 
      },
      relations: ['rewardProgram', 'rewardProgram.businessType'],
    });
  }

  async redeemReward(clientId: number, customerRewardId: number): Promise<CustomerReward> {
    const customerReward = await this.customerRewardRepository.findOne({
      where: { 
        id: customerRewardId,
        client: { id: clientId },
        status: CustomerRewardStatus.EARNED 
      },
      relations: ['rewardProgram'],
    });

    if (!customerReward) {
      throw new NotFoundException('Recompensa no encontrada o ya canjeada');
    }

    if (customerReward.expiresAt && customerReward.expiresAt < new Date()) {
      customerReward.status = CustomerRewardStatus.EXPIRED;
      await this.customerRewardRepository.save(customerReward);
      throw new BadRequestException('La recompensa ha expirado');
    }

    if (customerReward.timesUsed >= customerReward.rewardProgram.maxUsesPerCustomer) {
      throw new BadRequestException('Has alcanzado el límite máximo de usos para esta recompensa');
    }

    customerReward.status = CustomerRewardStatus.REDEEMED;
    customerReward.redeemedAt = new Date();
    customerReward.timesUsed += 1;

    return await this.customerRewardRepository.save(customerReward);
  }

  // Lógica de Progreso Automático
  async updateClientProgress(clientId: number, conditionType: RewardConditionType, value: number): Promise<void> {
    const client = await this.clientRepository.findOne({ where: { id: clientId } });
    if (!client) {
      throw new NotFoundException(`Cliente con ID ${clientId} no encontrado`);
    }

    const activePrograms = await this.getActiveRewardPrograms();
    
    for (const program of activePrograms) {
      if (program.conditionType === conditionType) {
        await this.processRewardProgress(client, program, value);
      }
    }
  }

  private async processRewardProgress(client: Client, program: RewardProgram, incrementValue: number): Promise<void> {
    let customerReward = await this.customerRewardRepository.findOne({
      where: { 
        client: { id: client.id },
        rewardProgram: { id: program.id },
        status: CustomerRewardStatus.IN_PROGRESS 
      },
    });

    if (!customerReward) {
      customerReward = this.customerRewardRepository.create({
        client,
        rewardProgram: program,
        currentProgress: 0,
        targetValue: program.conditionValue,
        status: CustomerRewardStatus.IN_PROGRESS,
      });
    }

    customerReward.currentProgress += incrementValue;

    if (customerReward.currentProgress >= customerReward.targetValue) {
      customerReward.status = CustomerRewardStatus.EARNED;
      customerReward.earnedAt = new Date();
      
      if (program.validUntil) {
        customerReward.expiresAt = program.validUntil;
      }

      // Send reward notification email and push notification
      await this.sendRewardEarnedNotification(client, customerReward, program);
    }

    await this.customerRewardRepository.save(customerReward);
  }

  // Métodos de integración con otros módulos
  async onAppointmentCompleted(clientId: number): Promise<void> {
    await this.updateClientProgress(clientId, RewardConditionType.VISIT_COUNT, 1);
  }

  async onConsultationCompleted(clientId: number): Promise<void> {
    await this.updateClientProgress(clientId, RewardConditionType.CONSULTATION_COUNT, 1);
  }

  async onServiceCompleted(clientId: number): Promise<void> {
    await this.updateClientProgress(clientId, RewardConditionType.SERVICE_COUNT, 1);
  }

  async onPurchaseCompleted(clientId: number, amount: number): Promise<void> {
    await this.updateClientProgress(clientId, RewardConditionType.PURCHASE_AMOUNT, amount);
  }

  // Métricas y Analytics
  async getRewardsMetrics(): Promise<any> {
    const totalActivePrograms = await this.rewardProgramRepository.count({
      where: { status: RewardProgramStatus.ACTIVE }
    });

    const totalActiveRewards = await this.customerRewardRepository.count({
      where: { status: CustomerRewardStatus.IN_PROGRESS }
    });

    const totalEarnedRewards = await this.customerRewardRepository.count({
      where: { status: CustomerRewardStatus.EARNED }
    });

    const totalRedeemedRewards = await this.customerRewardRepository.count({
      where: { status: CustomerRewardStatus.REDEEMED }
    });

    return {
      totalActivePrograms,
      totalActiveRewards,
      totalEarnedRewards,
      totalRedeemedRewards,
    };
  }

  // Búsqueda de Clientes para Recompensas
  async searchClientsForRewards(query: string): Promise<Client[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchTerm = `%${query.trim()}%`;
    
    return await this.clientRepository
      .createQueryBuilder('client')
      .where('client.name LIKE :searchTerm', { searchTerm })
      .orWhere('client.lastName LIKE :searchTerm', { searchTerm })
      .orWhere('client.phone LIKE :searchTerm', { searchTerm })
      .orWhere('client.email LIKE :searchTerm', { searchTerm })
      .orWhere('client.membershipNumber LIKE :searchTerm', { searchTerm })
      .orWhere('CONCAT(client.name, \' \', client.lastName) LIKE :searchTerm', { searchTerm })
      .orderBy('client.name', 'ASC')
      .limit(10)
      .getMany();
  }

  async cleanupExpiredRewards(): Promise<void> {
    const expiredRewards = await this.customerRewardRepository.find({
      where: { 
        status: CustomerRewardStatus.EARNED,
      },
    });

    const now = new Date();
    for (const reward of expiredRewards) {
      if (reward.expiresAt && reward.expiresAt < now) {
        reward.status = CustomerRewardStatus.EXPIRED;
        await this.customerRewardRepository.save(reward);
      }
    }
  }

  // Email and notification methods
  private async sendRewardEarnedNotification(
    client: Client, 
    customerReward: CustomerReward, 
    program: RewardProgram
  ): Promise<void> {
    try {
      // Get client's other active rewards for progress display
      const otherRewards = await this.getClientActiveRewards(client.id);
      const otherRewardsData = otherRewards
        .filter(r => r.id !== customerReward.id)
        .map(reward => ({
          programName: reward.rewardProgram.name,
          currentProgress: parseFloat(reward.currentProgress.toString()),
          targetValue: parseFloat(reward.targetValue.toString()),
          progressPercentage: Math.round((parseFloat(reward.currentProgress.toString()) / parseFloat(reward.targetValue.toString())) * 100),
          remaining: parseFloat(reward.targetValue.toString()) - parseFloat(reward.currentProgress.toString()),
          isClose: (parseFloat(reward.targetValue.toString()) - parseFloat(reward.currentProgress.toString())) <= 2,
        }));

      // Determine reward type display
      let rewardType = '';
      let isPercentage = false;
      let isAmount = false;
      let isFreeService = false;
      let isPoints = false;
      let rewardDescription = '';

      switch (program.rewardType) {
        case 'DISCOUNT_PERCENTAGE':
          rewardType = 'Descuento';
          isPercentage = true;
          break;
        case 'DISCOUNT_AMOUNT':
          rewardType = 'Descuento';
          isAmount = true;
          break;
        case 'FREE_SERVICE':
          rewardType = 'Servicio Gratuito';
          isFreeService = true;
          rewardDescription = program.description || 'Servicio gratuito';
          break;
        case 'POINTS':
          rewardType = 'Puntos';
          isPoints = true;
          break;
      }

      // Send email notification
      await this.emailService.sendTemplateEmail({
        to: [client.email],
        templateId: 'reward-notification', // This would need to be the actual template ID
        templateVariables: {
          clientName: `${client.name} ${client.lastName}`,
          programName: program.name,
          rewardType,
          rewardValue: program.rewardValue,
          isPercentage,
          isAmount,
          isFreeService,
          isPoints,
          rewardDescription,
          expirationDate: customerReward.expiresAt ? 
            customerReward.expiresAt.toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) : null,
          redeemUrl: `${process.env.FRONTEND_URL}/rewards/redeem/${customerReward.id}`,
          otherRewards: otherRewardsData,
        },
      });

      // Send push notification
      await this.notificationService.create(
        '🎉 ¡Recompensa Ganada!',
        `Has completado el programa "${program.name}" y ganado una nueva recompensa.`,
        client.id
      );

    } catch (error) {
      console.error('Error sending reward notification:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }
}