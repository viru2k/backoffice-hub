import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BusinessType } from '../../business-type/entities/business-type.entity';
import { CustomerReward } from './customer-reward.entity';

export enum RewardConditionType {
  VISIT_COUNT = 'VISIT_COUNT',
  PURCHASE_AMOUNT = 'PURCHASE_AMOUNT',
  SERVICE_COUNT = 'SERVICE_COUNT',
  CONSULTATION_COUNT = 'CONSULTATION_COUNT',
}

export enum RewardType {
  DISCOUNT_PERCENTAGE = 'DISCOUNT_PERCENTAGE',
  DISCOUNT_AMOUNT = 'DISCOUNT_AMOUNT',
  FREE_SERVICE = 'FREE_SERVICE',
  POINTS = 'POINTS',
}

export enum RewardProgramStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DRAFT = 'DRAFT',
}

@Entity('reward_programs')
export class RewardProgram {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: RewardConditionType,
  })
  conditionType: RewardConditionType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  conditionValue: number;

  @Column({
    type: 'enum',
    enum: RewardType,
  })
  rewardType: RewardType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  rewardValue: number;

  @Column({ type: 'int', default: 1 })
  maxUsesPerCustomer: number;

  @Column({ type: 'date', nullable: true })
  validFrom: Date;

  @Column({ type: 'date', nullable: true })
  validUntil: Date;

  @Column({
    type: 'enum',
    enum: RewardProgramStatus,
    default: RewardProgramStatus.ACTIVE,
  })
  status: RewardProgramStatus;

  @Column({ type: 'json', nullable: true })
  additionalConditions: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => BusinessType, (businessType) => businessType.id, {
    nullable: true,
  })
  businessType: BusinessType;

  @OneToMany(() => CustomerReward, (customerReward) => customerReward.rewardProgram)
  customerRewards: CustomerReward[];
}