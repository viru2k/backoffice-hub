import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { RewardConditionType, RewardType, RewardProgramStatus } from '../entities/reward-program.entity';

export class BusinessTypeDto {
  @ApiProperty({ description: 'ID único del tipo de negocio' })
  @Expose()
  id: number;

  @ApiProperty({ description: 'Código identificador del tipo de negocio' })
  @Expose()
  code: string;

  @ApiProperty({ description: 'Nombre del tipo de negocio' })
  @Expose()
  name: string;

  @ApiProperty({ description: 'Descripción del tipo de negocio' })
  @Expose()
  description: string;
}

export class RewardProgramResponseDto {
  @ApiProperty({ description: 'ID único del programa de recompensas' })
  @Expose()
  id: number;

  @ApiProperty({ description: 'Nombre del programa de recompensas' })
  @Expose()
  name: string;

  @ApiProperty({ description: 'Descripción del programa' })
  @Expose()
  description: string;

  @ApiProperty({ description: 'Tipo de condición para ganar la recompensa', enum: RewardConditionType })
  @Expose()
  conditionType: RewardConditionType;

  @ApiProperty({ description: 'Valor numérico de la condición (ej: 5 visitas, $100 de compra)' })
  @Expose()
  conditionValue: number;

  @ApiProperty({ description: 'Tipo de recompensa otorgada', enum: RewardType })
  @Expose()
  rewardType: RewardType;

  @ApiProperty({ description: 'Valor de la recompensa (ej: 20%, $50)' })
  @Expose()
  rewardValue: number;

  @ApiProperty({ description: 'Máximo número de veces que un cliente puede usar esta recompensa' })
  @Expose()
  maxUsesPerCustomer: number;

  @ApiProperty({ description: 'Fecha de inicio de validez del programa' })
  @Expose()
  validFrom: Date;

  @ApiProperty({ description: 'Fecha de fin de validez del programa' })
  @Expose()
  validUntil: Date;

  @ApiProperty({ description: 'Estado actual del programa', enum: RewardProgramStatus })
  @Expose()
  status: RewardProgramStatus;

  @ApiProperty({ description: 'Condiciones adicionales en formato JSON' })
  @Expose()
  additionalConditions: Record<string, any>;

  @ApiProperty({ description: 'Fecha de creación del programa' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de última actualización' })
  @Expose()
  updatedAt: Date;

  @ApiProperty({ description: 'Información del tipo de negocio asociado', type: BusinessTypeDto })
  @Expose()
  @Type(() => BusinessTypeDto)
  businessType: BusinessTypeDto;
}