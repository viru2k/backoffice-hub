import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { Client } from '../client/entities/client.entity';
import { Appointment } from '../agenda/entities/appointment.entity';
import { CustomerReward } from '../rewards/entities/customer-reward.entity';
import { RewardProgram } from '../rewards/entities/reward-program.entity';
import { ClientPortalController } from './client-portal.controller';
import { ClientPortalService } from './client-portal.service';
import { ClientAuthController } from './auth/client-auth.controller';
import { ClientAuthService } from './auth/client-auth.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Client, Appointment, CustomerReward, RewardProgram]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
    NotificationModule, // Para envío de emails automáticos
  ],
  controllers: [
    ClientPortalController,
    ClientAuthController,
  ],
  providers: [
    ClientPortalService,
    ClientAuthService,
  ],
  exports: [
    ClientAuthService,
    ClientPortalService,
  ],
})
export class ClientPortalModule {}