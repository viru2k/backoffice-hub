import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { FailedNotification } from './entities/failed-notification.entity';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, FailedNotification])],
  providers: [NotificationService],
  controllers: [NotificationController],
  exports: [
    NotificationService,
    TypeOrmModule, 
  ],
})
export class NotificationModule {}
