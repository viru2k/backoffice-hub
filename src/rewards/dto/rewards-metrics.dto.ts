import { Expose } from 'class-transformer';

export class RewardsMetricsDto {
  @Expose()
  totalActivePrograms: number;

  @Expose()
  totalActiveRewards: number;

  @Expose()
  totalEarnedRewards: number;

  @Expose()
  totalRedeemedRewards: number;

  @Expose()
  get redemptionRate(): number {
    const totalCompleted = this.totalEarnedRewards + this.totalRedeemedRewards;
    return totalCompleted > 0 ? (this.totalRedeemedRewards / totalCompleted) * 100 : 0;
  }
}