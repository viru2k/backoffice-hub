import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AppointmentStatus } from '../entities/appointment.entity';

export class UpdateAppointmentStatusDto {
  @ApiProperty({ enum: ['pending', 'confirmed', 'checked_in', 'in_progress', 'cancelled', 'completed', 'no_show'] })
  @IsIn(['pending', 'confirmed', 'checked_in', 'in_progress', 'cancelled', 'completed', 'no_show'])
  status: AppointmentStatus;
}
