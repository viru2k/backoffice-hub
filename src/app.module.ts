import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { ServiceModule } from './service/service.module';
import { AgendaModule } from './agenda/agenda.module';
import { RolesModule } from './roles/roles.module';
import { NotificationModule } from './notification/notification.module';
import { ProductModule } from './product/product.module';
import { StockModule } from './stock/stock.module';
import { ClientModule } from './client/client.module';
import { SubscriptionPlanModule } from './subscription-plan/subscription-plan.module';
import { SeedModule } from './seed/seed.module';
import { FullFlowExtendedSeedService } from './seed/full-flow-extended.seed';
import { PermissionsModule } from './permissions/permissions.module';


@Module({
  imports: [
    AuthModule,
    UserModule,
    SubscriptionModule,
    ServiceModule,
    AgendaModule,
    ProductModule,
    StockModule,
    ClientModule,
    SubscriptionPlanModule,
    NotificationModule,
    SeedModule,
    RolesModule,
    PermissionsModule,
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10) || 3306,
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'admin123',
      database: process.env.DB_NAME || 'backoffice_core',
      autoLoadEntities: true,
      synchronize: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService, FullFlowExtendedSeedService],
})
export class AppModule {}
