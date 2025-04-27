import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { SubscriptionPlan } from './subscription-plan.entity';

@Entity('subscription_plan_feature')
export class SubscriptionPlanFeature {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => SubscriptionPlan, plan => plan.features, { onDelete: 'CASCADE' })
  subscriptionPlan: SubscriptionPlan;

  @Column()
  feature: string; // Ej: 'agenda', 'stock', 'clients', etc.

  @Column({ default: true })
  enabled: boolean;
}
