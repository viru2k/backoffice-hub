import { IsOptional, IsString, IsNumber, IsDateString, IsEnum, IsArray, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConsultationStatus } from '../entities/consultation.entity';

export class CreateConsultationDto {
  @ApiPropertyOptional({ description: 'ID de la cita relacionada' })
  @IsOptional()
  @IsNumber()
  appointmentId?: number;

  @ApiProperty({ description: 'ID del cliente/paciente' })
  @IsNumber()
  clientId: number;

  @ApiPropertyOptional({ description: 'Estado de la consulta', enum: ['pending', 'in_progress', 'completed', 'cancelled'] })
  @IsOptional()
  @IsEnum(['pending', 'in_progress', 'completed', 'cancelled'])
  status?: ConsultationStatus;

  @ApiPropertyOptional({ description: 'Hora de inicio de la consulta' })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional({ description: 'Hora de fin de la consulta' })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({ description: 'Notas generales de la consulta' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Síntomas reportados por el cliente' })
  @IsOptional()
  @IsString()
  symptoms?: string;

  @ApiPropertyOptional({ description: 'Diagnóstico realizado' })
  @IsOptional()
  @IsString()
  diagnosis?: string;

  @ApiPropertyOptional({ description: 'Tratamiento prescrito o realizado' })
  @IsOptional()
  @IsString()
  treatment?: string;

  @ApiPropertyOptional({ description: 'Recomendaciones para el cliente' })
  @IsOptional()
  @IsString()
  recommendations?: string;

  @ApiPropertyOptional({ description: 'Fecha para próxima cita' })
  @IsOptional()
  @IsDateString()
  nextAppointment?: string;

  @ApiPropertyOptional({ description: 'Peso del cliente (kg)' })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional({ description: 'Altura del cliente (m)' })
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiPropertyOptional({ description: 'Presión arterial (ej: 120/80)' })
  @IsOptional()
  @IsString()
  bloodPressure?: string;

  @ApiPropertyOptional({ description: 'Temperatura corporal (°C)' })
  @IsOptional()
  @IsNumber()
  temperature?: number;

  @ApiPropertyOptional({ description: 'Frecuencia cardíaca (bpm)' })
  @IsOptional()
  @IsNumber()
  heartRate?: number;

  @ApiPropertyOptional({ description: 'Signos vitales adicionales (JSON)' })
  @IsOptional()
  vitals?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Lista de alergias conocidas' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @ApiPropertyOptional({ description: 'Medicamentos actuales' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  medications?: string[];

  @ApiPropertyOptional({ description: 'Requiere seguimiento' })
  @IsOptional()
  @IsBoolean()
  followUpRequired?: boolean;

  @ApiPropertyOptional({ description: 'Fecha de seguimiento' })
  @IsOptional()
  @IsDateString()
  followUpDate?: string;
}