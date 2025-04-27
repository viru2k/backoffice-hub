import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { SubscriptionPlanFeature } from './subscription-plan-feature.entity';
import { Subscription } from '../../subscription/entities/subscription.entity';

@Entity('subscription_plan')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  priceMonthly: number;

  @Column('decimal', { precision: 10, scale: 2 })
  priceSemiannual: number;

  @Column('decimal', { precision: 10, scale: 2 })
  priceAnnual: number;

  @Column()
  maxUsers: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @OneToMany(() => SubscriptionPlanFeature, feature => feature.subscriptionPlan)
  features: SubscriptionPlanFeature[];

  @OneToMany(() => Subscription, subscription => subscription.subscriptionPlan)
  subscriptions: Subscription[];
}
