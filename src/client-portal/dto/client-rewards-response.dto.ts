import { ApiProperty } from '@nestjs/swagger';

export class ClientRewardProgressDto {
  @ApiProperty({ description: 'ID del programa de recompensas' })
  programId: number;

  @ApiProperty({ description: 'Nombre del programa' })
  programName: string;

  @ApiProperty({ description: 'Descripción del programa' })
  description: string;

  @ApiProperty({ description: 'Tipo de condición' })
  conditionType: string;

  @ApiProperty({ description: 'Valor objetivo para completar' })
  targetValue: number;

  @ApiProperty({ description: 'Valor actual del cliente' })
  currentValue: number;

  @ApiProperty({ description: 'Porcentaje de progreso (0-100)' })
  progressPercentage: number;

  @ApiProperty({ description: 'Está completado y listo para canjear' })
  isCompleted: boolean;

  @ApiProperty({ description: 'Fecha límite del programa', required: false })
  validUntil?: Date;

  @ApiProperty({ description: 'Tipo de recompensa' })
  rewardType: string;

  @ApiProperty({ description: 'Valor de la recompensa' })
  rewardValue: number;
}

export class ClientAvailableRewardDto {
  @ApiProperty({ description: 'ID de la recompensa disponible' })
  rewardId: number;

  @ApiProperty({ description: 'ID del programa' })
  programId: number;

  @ApiProperty({ description: 'Nombre del programa' })
  programName: string;

  @ApiProperty({ description: 'Descripción de la recompensa' })
  description: string;

  @ApiProperty({ description: 'Tipo de recompensa' })
  rewardType: string;

  @ApiProperty({ description: 'Valor de la recompensa' })
  rewardValue: number;

  @ApiProperty({ description: 'Fecha en que completó el programa' })
  completedAt: Date;

  @ApiProperty({ description: 'Fecha límite para canjear', required: false })
  expiresAt?: Date;

  @ApiProperty({ description: 'Días restantes para canjear', required: false })
  daysToExpire?: number;
}

export class ClientRewardHistoryDto {
  @ApiProperty({ description: 'ID del registro' })
  id: number;

  @ApiProperty({ description: 'Nombre del programa' })
  programName: string;

  @ApiProperty({ description: 'Acción realizada' })
  action: string;

  @ApiProperty({ description: 'Descripción del cambio' })
  description: string;

  @ApiProperty({ description: 'Fecha de la acción' })
  date: Date;

  @ApiProperty({ description: 'Valor asociado', required: false })
  value?: number;
}

export class ClientRewardsSummaryDto {
  @ApiProperty({ description: 'Recompensas en progreso', type: [ClientRewardProgressDto] })
  inProgress: ClientRewardProgressDto[];

  @ApiProperty({ description: 'Recompensas disponibles para canjear', type: [ClientAvailableRewardDto] })
  availableRewards: ClientAvailableRewardDto[];

  @ApiProperty({ description: 'Historial de actividad', type: [ClientRewardHistoryDto] })
  history: ClientRewardHistoryDto[];

  @ApiProperty({ description: 'Estadísticas generales' })
  stats: {
    totalProgramsActive: number;
    totalRewardsEarned: number;
    totalRewardsRedeemed: number;
    totalRewardsExpired: number;
  };
}