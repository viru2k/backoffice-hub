import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RewardsService } from './rewards.service';
import { RewardsController } from './rewards.controller';
import { RewardProgram } from './entities/reward-program.entity';
import { CustomerReward } from './entities/customer-reward.entity';
import { Client } from '../client/entities/client.entity';
import { EmailModule } from '../email/email.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RewardProgram,
      CustomerReward,
      Client,
    ]),
    EmailModule,
    NotificationModule,
  ],
  controllers: [RewardsController],
  providers: [RewardsService],
  exports: [RewardsService, TypeOrmModule],
})
export class RewardsModule {}