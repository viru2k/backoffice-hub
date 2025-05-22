import { ApiProperty } from '@nestjs/swagger';
import { AppointmentStatus } from '../entities/appointment.entity'; // Ajusta la ruta si es necesario
import { ExtendedPropsDto } from './extended-props.dto'; // Asumiendo que este DTO ya existe y está exportado

// DTO simplificado para el profesional (usuario)
// AÑADIR EXPORT AQUÍ
export class AppointmentProfessionalResponseDto {
  @ApiProperty({ description: 'ID del profesional (usuario)' })
  id: number;

  @ApiProperty({ description: 'Nombre completo del profesional' })
  fullName: string;
}

// DTO simplificado para el cliente
// AÑADIR EXPORT AQUÍ
export class AppointmentClientResponseDto {
  @ApiProperty({ description: 'ID del cliente' })
  id: number;

  @ApiProperty({ description: 'Nombre completo del cliente' })
  fullname: string;

  @ApiProperty({ description: 'Apellido del cliente', required: false })
  lastName?: string;

  @ApiProperty({ description: 'Nombre del cliente', required: false })
  name?: string;
}

export class AppointmentResponseDto {
  @ApiProperty({ description: 'ID del turno (string para FullCalendar)', example: '123' })
  id: string;

  @ApiProperty({ description: 'Título del turno', example: 'Corte de Cabello' })
  title: string;

  @ApiProperty({ description: 'Fecha y hora de inicio del turno (ISO 8601)', example: '2025-05-22T10:00:00.000Z' })
  start: string;

  @ApiProperty({ description: 'Fecha y hora de fin del turno (ISO 8601)', example: '2025-05-22T11:00:00.000Z', required: false })
  end?: string;

  @ApiProperty({ description: 'Indica si el evento dura todo el día', default: false, required: false })
  allDay?: boolean;

  @ApiProperty({ description: 'Color del evento en el calendario', example: '#3788d8', required: false })
  color?: string;

  @ApiProperty({ description: 'Estado del turno', enum: ['pending', 'confirmed', 'cancelled', 'checked_in', 'in_progress', 'completed', 'no_show'] })
  status: AppointmentStatus;

  @ApiProperty({ description: 'Notas adicionales sobre el turno', required: false })
  notes?: string;
  
  @ApiProperty({ type: () => AppointmentClientResponseDto, description: 'Información del cliente asociado al turno', required: false }) // Usar () => para referencias circulares/adelantadas
  client?: AppointmentClientResponseDto;

  @ApiProperty({ type: () => AppointmentProfessionalResponseDto, description: 'Información del profesional asignado', required: false }) // Usar () =>
  professional?: AppointmentProfessionalResponseDto;
  
  @ApiProperty({ description: 'ID del servicio (si aplica)', required: false })
  serviceId?: number;

  @ApiProperty({ description: 'ID de la sala/recurso (si aplica)', required: false })
  roomId?: number;
  
  @ApiProperty({ description: 'Fecha de creación del turno' })
  createdAt: string;

  @ApiProperty({ description: 'Fecha de última actualización del turno' })
  updatedAt: string;

  @ApiProperty({
    type: () => ExtendedPropsDto, 
    required: false,
    description: 'Propiedades extendidas para FullCalendar',
  })
  extendedProps?: ExtendedPropsDto;
}