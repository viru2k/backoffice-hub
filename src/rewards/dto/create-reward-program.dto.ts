import { IsString, IsEnum, IsNumber, IsOptional, IsDateString, IsObject, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { RewardConditionType, RewardType, RewardProgramStatus } from '../entities/reward-program.entity';

export class CreateRewardProgramDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(RewardConditionType)
  conditionType: RewardConditionType;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  conditionValue: number;

  @IsEnum(RewardType)
  rewardType: RewardType;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  rewardValue: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  maxUsesPerCustomer?: number = 1;

  @IsOptional()
  @IsDateString()
  validFrom?: Date;

  @IsOptional()
  @IsDateString()
  validUntil?: Date;

  @IsOptional()
  @IsEnum(RewardProgramStatus)
  status?: RewardProgramStatus = RewardProgramStatus.ACTIVE;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  businessTypeId?: number;

  @IsOptional()
  @IsObject()
  additionalConditions?: Record<string, any>;
}