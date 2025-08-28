import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CustomerRewardStatus } from '../entities/customer-reward.entity';
import { RewardProgramResponseDto } from './reward-program-response.dto';

export class CustomerRewardResponseDto {
  @ApiProperty({ description: 'ID único de la recompensa del cliente' })
  @Expose()
  id: number;

  @ApiProperty({ description: 'Progreso actual del cliente hacia la recompensa' })
  @Expose()
  currentProgress: number;

  @ApiProperty({ description: 'Valor objetivo que debe alcanzar el cliente' })
  @Expose()
  targetValue: number;

  @ApiProperty({ description: 'Estado actual de la recompensa', enum: CustomerRewardStatus })
  @Expose()
  status: CustomerRewardStatus;

  @ApiProperty({ description: 'Fecha cuando se ganó la recompensa', required: false })
  @Expose()
  earnedAt: Date;

  @ApiProperty({ description: 'Fecha cuando se canjeó la recompensa', required: false })
  @Expose()
  redeemedAt: Date;

  @ApiProperty({ description: 'Fecha de expiración de la recompensa', required: false })
  @Expose()
  expiresAt: Date;

  @ApiProperty({ description: 'Número de veces que se ha usado esta recompensa' })
  @Expose()
  timesUsed: number;

  @ApiProperty({ description: 'Metadatos adicionales de la recompensa' })
  @Expose()
  metadata: Record<string, any>;

  @ApiProperty({ description: 'Fecha de creación' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de última actualización' })
  @Expose()
  updatedAt: Date;

  @ApiProperty({ description: 'Información del programa de recompensas asociado', type: RewardProgramResponseDto })
  @Expose()
  @Type(() => RewardProgramResponseDto)
  rewardProgram: RewardProgramResponseDto;

  @ApiProperty({ description: 'Porcentaje de progreso hacia la recompensa (0-100)', readOnly: true })
  @Expose()
  get progressPercentage(): number {
    return this.targetValue > 0 ? Math.min((this.currentProgress / this.targetValue) * 100, 100) : 0;
  }

  @ApiProperty({ description: 'Indica si la recompensa ha expirado', readOnly: true })
  @Expose()
  get isExpired(): boolean {
    return this.expiresAt ? new Date() > new Date(this.expiresAt) : false;
  }

  @ApiProperty({ description: 'Indica si la recompensa puede ser canjeada', readOnly: true })
  @Expose()
  get canRedeem(): boolean {
    return this.status === CustomerRewardStatus.EARNED && !this.isExpired;
  }
}