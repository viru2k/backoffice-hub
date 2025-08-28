import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RewardsMetricsDto {
  @ApiProperty({ description: 'Total de programas de recompensas activos' })
  @Expose()
  totalActivePrograms: number;

  @ApiProperty({ description: 'Total de recompensas activas (en progreso)' })
  @Expose()
  totalActiveRewards: number;

  @ApiProperty({ description: 'Total de recompensas ganadas por los clientes' })
  @Expose()
  totalEarnedRewards: number;

  @ApiProperty({ description: 'Total de recompensas canjeadas por los clientes' })
  @Expose()
  totalRedeemedRewards: number;

  @ApiProperty({ description: 'Porcentaje de redención de recompensas', readOnly: true })
  @Expose()
  get redemptionRate(): number {
    const totalCompleted = this.totalEarnedRewards + this.totalRedeemedRewards;
    return totalCompleted > 0 ? (this.totalRedeemedRewards / totalCompleted) * 100 : 0;
  }
}