import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsultationService } from './consultation.service';
import { ConsultationController } from './consultation.controller';
import { ConsultationTokenService } from './consultation-token.service';
import { PublicConsultationController } from './public-consultation.controller';
import { Consultation } from './entities/consultation.entity';
import { ConsultationToken } from './entities/consultation-token.entity';
import { FileUpload } from '../upload/entities/file-upload.entity';
import { BusinessType } from '../business-type/entities/business-type.entity';
import { ConsultationType } from '../business-type/entities/consultation-type.entity';
import { NotificationModule } from '../notification/notification.module';
import { EmailModule } from '../email/email.module';
import { UploadModule } from '../upload/upload.module';
import { RewardsModule } from '../rewards/rewards.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Consultation, ConsultationToken, FileUpload, BusinessType, ConsultationType]),
    NotificationModule,
    EmailModule,
    UploadModule,
    RewardsModule,
  ],
  controllers: [ConsultationController, PublicConsultationController],
  providers: [ConsultationService, ConsultationTokenService],
  exports: [ConsultationService, ConsultationTokenService],
})
export class ConsultationModule {}