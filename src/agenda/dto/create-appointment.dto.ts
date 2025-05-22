import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsBoolean, IsNumber } from 'class-validator';
import { AppointmentStatus } from '../entities/appointment.entity';

export class CreateAppointmentDto {
  @ApiProperty({ example: 'Corte de Pelo', description: 'Título del turno' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: '2025-05-23T10:00:00Z', description: 'Fecha y hora de inicio del turno (ISO 8601)' })
  @IsDateString()
  startDateTime: string;

  @ApiProperty({ example: '2025-05-23T11:00:00Z', description: 'Fecha y hora de fin del turno (ISO 8601)', required: false })
  @IsOptional()
  @IsDateString()
  endDateTime?: string;

  @ApiProperty({ example: 'Cliente prefiere corte con máquina nro 2.', required: false, description: 'Notas adicionales' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: false, default: false, description: 'Indica si el evento es de día completo', required: false })
  @IsOptional()
  @IsBoolean()
  allDay?: boolean;

  @ApiProperty({ example: 1, description: 'ID del cliente (paciente) asociado', required: false })
  @IsOptional()
  @IsNumber()
  clientId?: number;

  @ApiProperty({ example: 1, description: 'ID del profesional (usuario) asignado', required: false })
  @IsOptional()
  @IsNumber()
  professionalId?: number; // Usaremos esto para buscar el User

  @ApiProperty({ example: 'confirmed', description: 'Estado inicial del turno', required: false, enum: ['pending', 'confirmed', 'cancelled']})
  @IsOptional()
  @IsString() // Podrías usar IsEnum aquí si AppointmentStatus es un enum exportado
  status?: AppointmentStatus;

  @ApiProperty({ example: 1, description: 'ID del servicio (opcional)', required: false })
  @IsOptional()
  @IsNumber()
  serviceId?: number;

  @ApiProperty({ example: 1, description: 'ID de la sala/recurso (opcional)', required: false })
  @IsOptional()
  @IsNumber()
  roomId?: number;
}