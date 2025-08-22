import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Client } from '../../client/entities/client.entity';
import { RewardProgram } from './reward-program.entity';

export enum CustomerRewardStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  EARNED = 'EARNED',
  REDEEMED = 'REDEEMED',
  EXPIRED = 'EXPIRED',
}

@Entity('customer_rewards')
export class CustomerReward {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  currentProgress: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  targetValue: number;

  @Column({
    type: 'enum',
    enum: CustomerRewardStatus,
    default: CustomerRewardStatus.IN_PROGRESS,
  })
  status: CustomerRewardStatus;

  @Column({ type: 'datetime', nullable: true })
  earnedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  redeemedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  expiresAt: Date;

  @Column({ type: 'int', default: 0 })
  timesUsed: number;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Client, (client) => client.id, { onDelete: 'CASCADE' })
  client: Client;

  @ManyToOne(() => RewardProgram, (rewardProgram) => rewardProgram.customerRewards)
  rewardProgram: RewardProgram;
}