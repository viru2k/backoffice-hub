import { Expose, Type } from 'class-transformer';
import { RewardConditionType, RewardType, RewardProgramStatus } from '../entities/reward-program.entity';

export class BusinessTypeDto {
  @Expose()
  id: number;

  @Expose()
  code: string;

  @Expose()
  name: string;

  @Expose()
  description: string;
}

export class RewardProgramResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  conditionType: RewardConditionType;

  @Expose()
  conditionValue: number;

  @Expose()
  rewardType: RewardType;

  @Expose()
  rewardValue: number;

  @Expose()
  maxUsesPerCustomer: number;

  @Expose()
  validFrom: Date;

  @Expose()
  validUntil: Date;

  @Expose()
  status: RewardProgramStatus;

  @Expose()
  additionalConditions: Record<string, any>;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  @Type(() => BusinessTypeDto)
  businessType: BusinessTypeDto;
}