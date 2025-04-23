import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FailedNotification } from './entities/failed-notification.entity';
import { Notification } from './entities/notification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notification,FailedNotification])],
  providers: [NotificationService],
  controllers: [NotificationController],
  exports: [
    NotificationService,
    TypeOrmModule, 
  ],
})
export class NotificationModule {}
