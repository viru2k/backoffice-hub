import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { ServiceModule } from './service/service.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgendaModule } from './agenda/agenda.module';
import { NotificationModule } from './notification/notification.module';
import { ProductModule } from './product/product.module';
import { StockModule } from './stock/stock.module';

@Module({
  imports: [AuthModule, UserModule, SubscriptionModule, ServiceModule, AgendaModule,ProductModule ,StockModule , TypeOrmModule.forRoot({
    type: 'mysql',
    host: 'localhost',
    port: 3307, // recuerda, redireccionamos este puerto en Docker
    username: 'backadmin',
    password: 'backadmin123',
    database: 'backoffice_core',
    autoLoadEntities: true,
    synchronize: true, // solo en desarrollo
  }), NotificationModule, ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
