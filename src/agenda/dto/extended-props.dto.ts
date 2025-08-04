import { ApiProperty } from '@nestjs/swagger';
import { AppointmentStatus } from '../entities/appointment.entity'; // Asegúrate que la ruta sea correcta

export class ExtendedPropsDto {
  @ApiProperty({
    description: 'ID del recurso (podría ser professionalId o roomId)',
    required: false,
    oneOf: [{ type: 'number' }, { type: 'string' }],
    example: 'room1' 
  })
  resourceId?: number | string;

  @ApiProperty({
    description: 'Estado original del turno (útil para lógica del frontend)',
    enum: ['pending', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show'], // Refleja AppointmentStatus
    required: false,
    example: 'confirmed'
  })
  originalStatus?: AppointmentStatus;

  // Aquí puedes añadir más propiedades que necesites en extendedProps.
  // Por ejemplo, si 'notes' y otros campos de Appointment deben ir dentro de extendedProps:
   @ApiProperty({ description: 'Notas del turno', required: false })
   notes?: string;

   @ApiProperty({ description: 'ID del cliente', required: false })
   clientId?: number;

   @ApiProperty({ description: 'ID del profesional asociado al turno', required: false })
   professionalId?: number;

   @ApiProperty({ description: 'ID del servicio asociado al turno', required: false })
   serviceId?: number;

   @ApiProperty({ description: 'ID de la sala asociada al turno', required: false })
   roomId?: number;
}