import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { AgendaController } from './agenda.controller';
import { AgendaService } from './agenda.service';
import { AgendaConfig } from './entities/agenda-config.entity';
import { Holiday } from './entities/holiday.entity';
import { ReminderService } from 'src/service/reminder.service';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, AgendaConfig, Holiday])],
  controllers: [AgendaController],
  providers: [AgendaService, ReminderService],
})
export class AgendaModule {}
