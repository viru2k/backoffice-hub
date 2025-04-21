import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { ServiceModule } from './service/service.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [AuthModule, UserModule, SubscriptionModule, ServiceModule,  TypeOrmModule.forRoot({
    type: 'mysql',
    host: 'localhost',
    port: 3307, // recuerda, redireccionamos este puerto en Docker
    username: 'backadmin',
    password: 'backadmin123',
    database: 'backoffice_core',
    autoLoadEntities: true,
    synchronize: true, // solo en desarrollo
  }),],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
