import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RewardsService } from './rewards.service';
import { RewardsController } from './rewards.controller';
import { RewardProgram } from './entities/reward-program.entity';
import { CustomerReward } from './entities/customer-reward.entity';
import { Client } from '../client/entities/client.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RewardProgram,
      CustomerReward,
      Client,
    ]),
  ],
  controllers: [RewardsController],
  providers: [RewardsService],
  exports: [RewardsService, TypeOrmModule],
})
export class RewardsModule {}