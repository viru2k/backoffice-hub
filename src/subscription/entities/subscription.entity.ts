import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { SubscriptionPlan } from '../../subscription-plan/entities/subscription-plan.entity';

@Entity('subscription')
export class Subscription {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.subscriptions, { onDelete: 'CASCADE' })
  user: User; // Usuario principal (propietario de la suscripción)

  @ManyToOne(() => SubscriptionPlan, plan => plan.subscriptions, { eager: true })
  subscriptionPlan: SubscriptionPlan;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ default: 'active' })
  status: 'active' | 'expired' | 'cancelled';
}
