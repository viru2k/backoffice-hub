import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { FullFlowExtendedSeedService } from './full-flow-extended.seed';
import { SubscriptionPlan } from '../subscription-plan/entities/subscription-plan.entity';
import { SubscriptionPlanFeature } from '../subscription-plan/entities/subscription-plan-feature.entity';
import { User } from '../user/entities/user.entity';
import { Subscription } from '../subscription/entities/subscription.entity';
import { Product } from '../product/entities/product.entity';
import { ProductPriceHistory } from '../product/entities/product-price-history.entity';
import { StockMovement } from '../stock/entities/stock-movement.entity';
import { Appointment } from '../agenda/entities/appointment.entity';
import { AppointmentProductLog } from '../agenda/entities/appointment-product-log.entity';
import { Client } from '../client/entities/client.entity';
import { Holiday } from '../agenda/entities/holiday.entity';
import { AgendaConfig } from '../agenda/entities/agenda-config.entity';
import { Service } from '../agenda/entities/service.entity';
import { Room } from '../agenda/entities/room.entity';
import { Permission } from '../permissions/entities/permission.entity'; 
import { Role } from '../roles/entities/role.entity';

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
      Service,
      Room,
      Permission, // <-- AÑADIR Permission
      Role,       // <-- AÑADIR Role
    ]),
  ],
  providers: [SeedService, FullFlowExtendedSeedService],
  exports: [SeedService,TypeOrmModule], 
})
export class SeedModule {}
