import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { AgendaController } from './agenda.controller';
import { AgendaService } from './agenda.service';
import { AgendaConfig } from './entities/agenda-config.entity';
import { Holiday } from './entities/holiday.entity';
import { ReminderService } from 'src/service/reminder.service'; // Asumiendo que ReminderService está aquí
import { NotificationModule } from 'src/notification/notification.module';
import { Product } from 'src/product/entities/product.entity';
import { AppointmentProductLog } from './entities/appointment-product-log.entity';
import { StockMovement } from 'src/stock/entities/stock-movement.entity';

// Importar las entidades User y Client
import { User } from 'src/user/entities/user.entity';
import { Client } from 'src/client/entities/client.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      AgendaConfig,
      Holiday,
      Product,
      AppointmentProductLog,
      StockMovement,
      User,   
      Client, 
    ]),
    NotificationModule, 
  ],
  providers: [AgendaService, ReminderService],
  controllers: [AgendaController],
  exports: [TypeOrmModule, AgendaService], 
})
export class AgendaModule {}