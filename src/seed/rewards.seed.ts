import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RewardProgram, RewardConditionType, RewardType, RewardProgramStatus } from '../rewards/entities/reward-program.entity';
import { CustomerReward, CustomerRewardStatus } from '../rewards/entities/customer-reward.entity';
import { BusinessType } from '../business-type/entities/business-type.entity';
import { Client } from '../client/entities/client.entity';

@Injectable()
export class RewardsSeedService {
  constructor(
    @InjectRepository(RewardProgram)
    private rewardProgramRepository: Repository<RewardProgram>,
    @InjectRepository(CustomerReward)
    private customerRewardRepository: Repository<CustomerReward>,
    @InjectRepository(BusinessType)
    private businessTypeRepository: Repository<BusinessType>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
  ) {}

  async seed(): Promise<void> {
    console.log('🎁 Iniciando seed de sistema de recompensas...');

    // Verificar si ya existen programas de recompensas
    const existingPrograms = await this.rewardProgramRepository.count();
    if (existingPrograms > 0) {
      console.log('⚠️  Programas de recompensas ya existen, saltando seed...');
      return;
    }

    // Obtener tipos de negocio existentes
    const businessTypes = await this.businessTypeRepository.find();
    const beautyBusiness = businessTypes.find(bt => bt.code === 'beauty');
    const psychologyBusiness = businessTypes.find(bt => bt.code === 'psychology');
    const veterinaryBusiness = businessTypes.find(bt => bt.code === 'veterinary');

    // Crear programas de recompensas
    const programs = [
      // Programa general (sin tipo de negocio específico)
      {
        name: 'Cliente Fiel',
        description: 'Programa de fidelidad general para todos los clientes',
        conditionType: RewardConditionType.VISIT_COUNT,
        conditionValue: 5,
        rewardType: RewardType.DISCOUNT_PERCENTAGE,
        rewardValue: 10,
        maxUsesPerCustomer: 3,
        status: RewardProgramStatus.ACTIVE,
        businessType: null,
      },
      // Programa para belleza
      {
        name: 'Belleza VIP',
        description: '5 servicios de belleza y el 6to es gratis',
        conditionType: RewardConditionType.SERVICE_COUNT,
        conditionValue: 5,
        rewardType: RewardType.FREE_SERVICE,
        rewardValue: 1,
        maxUsesPerCustomer: 5,
        status: RewardProgramStatus.ACTIVE,
        businessType: beautyBusiness,
      },
      // Programa para psicología
      {
        name: 'Bienestar Mental',
        description: '3 consultas completadas, 15% descuento en la próxima',
        conditionType: RewardConditionType.CONSULTATION_COUNT,
        conditionValue: 3,
        rewardType: RewardType.DISCOUNT_PERCENTAGE,
        rewardValue: 15,
        maxUsesPerCustomer: 2,
        status: RewardProgramStatus.ACTIVE,
        businessType: psychologyBusiness,
      },
      // Programa para veterinaria
      {
        name: 'Mascota Saludable',
        description: 'Compras mayores a $100 obtienen $15 de descuento',
        conditionType: RewardConditionType.PURCHASE_AMOUNT,
        conditionValue: 100,
        rewardType: RewardType.DISCOUNT_AMOUNT,
        rewardValue: 15,
        maxUsesPerCustomer: 10,
        status: RewardProgramStatus.ACTIVE,
        businessType: veterinaryBusiness,
      },
      // Programa por cantidad de visitas
      {
        name: 'Super Cliente',
        description: '10 visitas completadas, $25 de descuento',
        conditionType: RewardConditionType.VISIT_COUNT,
        conditionValue: 10,
        rewardType: RewardType.DISCOUNT_AMOUNT,
        rewardValue: 25,
        maxUsesPerCustomer: 1,
        status: RewardProgramStatus.ACTIVE,
        businessType: null,
      },
      // Programa inactivo para pruebas
      {
        name: 'Programa Temporal',
        description: 'Programa de prueba inactivo',
        conditionType: RewardConditionType.VISIT_COUNT,
        conditionValue: 3,
        rewardType: RewardType.DISCOUNT_PERCENTAGE,
        rewardValue: 5,
        maxUsesPerCustomer: 1,
        status: RewardProgramStatus.INACTIVE,
        businessType: null,
      },
    ];

    const createdPrograms = [];
    for (const programData of programs) {
      const program = this.rewardProgramRepository.create(programData);
      const savedProgram = await this.rewardProgramRepository.save(program);
      createdPrograms.push(savedProgram);
      console.log(`✅ Programa creado: ${savedProgram.name}`);
    }

    // Crear algunas recompensas de cliente para pruebas
    const clients = await this.clientRepository.find({ take: 3 });
    
    if (clients.length > 0) {
      console.log('🎯 Creando recompensas de ejemplo para clientes...');
      
      // Cliente 1: En progreso hacia recompensa
      if (clients[0] && createdPrograms[0]) {
        const inProgressReward = this.customerRewardRepository.create({
          client: clients[0],
          rewardProgram: createdPrograms[0], // Cliente Fiel
          currentProgress: 3,
          targetValue: 5,
          status: CustomerRewardStatus.IN_PROGRESS,
        });
        await this.customerRewardRepository.save(inProgressReward);
        console.log(`✅ Recompensa en progreso creada para ${clients[0].fullname}`);
      }

      // Cliente 2: Recompensa ganada
      if (clients[1] && createdPrograms[1]) {
        const earnedReward = this.customerRewardRepository.create({
          client: clients[1],
          rewardProgram: createdPrograms[1], // Belleza VIP
          currentProgress: 5,
          targetValue: 5,
          status: CustomerRewardStatus.EARNED,
          earnedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
        });
        await this.customerRewardRepository.save(earnedReward);
        console.log(`✅ Recompensa ganada creada para ${clients[1].fullname}`);
      }

      // Cliente 3: Recompensa canjeada
      if (clients[2] && createdPrograms[2]) {
        const redeemedReward = this.customerRewardRepository.create({
          client: clients[2],
          rewardProgram: createdPrograms[2], // Bienestar Mental
          currentProgress: 3,
          targetValue: 3,
          status: CustomerRewardStatus.REDEEMED,
          earnedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 días atrás
          redeemedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 días atrás
          timesUsed: 1,
        });
        await this.customerRewardRepository.save(redeemedReward);
        console.log(`✅ Recompensa canjeada creada para ${clients[2].fullname}`);
      }
    }

    console.log('🎉 Seed de sistema de recompensas completado exitosamente!');
    console.log(`📊 Programas creados: ${createdPrograms.length}`);
    console.log(`🎁 Recompensas de ejemplo: ${Math.min(clients.length, 3)}`);
  }

  async clear(): Promise<void> {
    console.log('🧹 Limpiando datos de recompensas...');
    
    await this.customerRewardRepository.delete({});
    console.log('✅ Recompensas de clientes eliminadas');
    
    await this.rewardProgramRepository.delete({});
    console.log('✅ Programas de recompensas eliminados');
    
    console.log('🧹 Limpieza de recompensas completada');
  }
}