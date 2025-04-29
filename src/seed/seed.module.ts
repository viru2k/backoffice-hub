import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionPlan } from '../subscription-plan/entities/subscription-plan.entity';
import { SubscriptionPlanFeature } from '../subscription-plan/entities/subscription-plan-feature.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([SubscriptionPlan, SubscriptionPlanFeature])],
  providers: [SeedService],
  exports: [SeedService,TypeOrmModule], 
})
export class SeedModule {}
