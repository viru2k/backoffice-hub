import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { AgendaController } from './agenda.controller';
import { AgendaService } from './agenda.service';
import { AgendaConfig } from './entities/agenda-config.entity';
import { Holiday } from './entities/holiday.entity';
import { ReminderService } from '../service/reminder.service'; // Asumiendo que ReminderService está aquí
import { NotificationModule } from '../notification/notification.module';
import { Product } from '../product/entities/product.entity';
import { AppointmentProductLog } from './entities/appointment-product-log.entity';
import { StockMovement } from '../stock/entities/stock-movement.entity';

// Importar las entidades User y Client
import { User } from '../user/entities/user.entity';
import { Client } from '../client/entities/client.entity';
import { UserModule } from '../user/user.module';

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
     UserModule,
  ],
  providers: [AgendaService, ReminderService],
  controllers: [AgendaController],
  exports: [TypeOrmModule, AgendaService], 
})
export class AgendaModule {}