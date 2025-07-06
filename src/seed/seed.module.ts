import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { FullFlowExtendedSeedService } from './full-flow-extended.seed';
import { SubscriptionPlan } from 'src/subscription-plan/entities/subscription-plan.entity';
import { SubscriptionPlanFeature } from 'src/subscription-plan/entities/subscription-plan-feature.entity';
import { User } from 'src/user/entities/user.entity';
import { Subscription } from 'src/subscription/entities/subscription.entity';
import { Product } from 'src/product/entities/product.entity';
import { ProductPriceHistory } from 'src/product/entities/product-price-history.entity';
import { StockMovement } from 'src/stock/entities/stock-movement.entity';
import { Appointment } from 'src/agenda/entities/appointment.entity';
import { AppointmentProductLog } from 'src/agenda/entities/appointment-product-log.entity';
import { Client } from 'src/client/entities/client.entity';
import { Holiday } from 'src/agenda/entities/holiday.entity';
import { AgendaConfig } from 'src/agenda/entities/agenda-config.entity';
import { Permission } from 'src/permissions/entities/permission.entity'; 
import { Role } from 'src/roles/entities/role.entity';

@Module({
 imports: [
    TypeOrmModule.forFeature([
      SubscriptionPlan,
      SubscriptionPlanFeature,
      User,
      Subscription,
      Product,
      ProductPriceHistory,
      StockMovement,
      Appointment,
      AppointmentProductLog,
      Client,
      Holiday,
      AgendaConfig,
      Permission, // <-- AÑADIR Permission
      Role,       // <-- AÑADIR Role
    ]),
  ],
  providers: [SeedService, FullFlowExtendedSeedService],
  exports: [SeedService,TypeOrmModule], 
})
export class SeedModule {}
