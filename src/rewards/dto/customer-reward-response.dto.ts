import { Expose, Type } from 'class-transformer';
import { CustomerRewardStatus } from '../entities/customer-reward.entity';
import { RewardProgramResponseDto } from './reward-program-response.dto';

export class CustomerRewardResponseDto {
  @Expose()
  id: number;

  @Expose()
  currentProgress: number;

  @Expose()
  targetValue: number;

  @Expose()
  status: CustomerRewardStatus;

  @Expose()
  earnedAt: Date;

  @Expose()
  redeemedAt: Date;

  @Expose()
  expiresAt: Date;

  @Expose()
  timesUsed: number;

  @Expose()
  metadata: Record<string, any>;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  @Type(() => RewardProgramResponseDto)
  rewardProgram: RewardProgramResponseDto;

  @Expose()
  get progressPercentage(): number {
    return this.targetValue > 0 ? Math.min((this.currentProgress / this.targetValue) * 100, 100) : 0;
  }

  @Expose()
  get isExpired(): boolean {
    return this.expiresAt ? new Date() > new Date(this.expiresAt) : false;
  }

  @Expose()
  get canRedeem(): boolean {
    return this.status === CustomerRewardStatus.EARNED && !this.isExpired;
  }
}