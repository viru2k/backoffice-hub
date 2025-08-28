import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Appointment } from '../agenda/entities/appointment.entity';
import { Consultation } from '../consultation/entities/consultation.entity';
import { Client } from '../client/entities/client.entity';
import { Invoice } from '../invoice/entities/invoice.entity';
import { BusinessType } from '../business-type/entities/business-type.entity';
import { ConsultationType } from '../business-type/entities/consultation-type.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      Consultation,
      Client,
      Invoice,
      BusinessType,
      ConsultationType,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}