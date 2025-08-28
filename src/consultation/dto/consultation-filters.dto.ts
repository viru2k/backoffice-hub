import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsDateString, IsNumber, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ConsultationStatus } from '../entities/consultation.entity';

export class ConsultationFiltersDto {
  @ApiProperty({ required: false, description: 'ID del cliente/paciente' })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  clientId?: number;

  @ApiProperty({ required: false, description: 'Estado de la consulta', enum: ['pending', 'in_progress', 'completed', 'cancelled'] })
  @IsOptional()
  @IsEnum(['pending', 'in_progress', 'completed', 'cancelled'])
  status?: ConsultationStatus;

  @ApiProperty({ required: false, description: 'Fecha específica (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({ required: false, description: 'Solo consultas de hoy', default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  today?: boolean;

  @ApiProperty({ required: false, description: 'Desde fecha (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiProperty({ required: false, description: 'Hasta fecha (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiProperty({ required: false, description: 'ID del tipo de consulta' })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  consultationTypeId?: number;

  @ApiProperty({ required: false, description: 'ID del profesional' })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  userId?: number;

  @ApiProperty({ required: false, description: 'Búsqueda por nombre del cliente' })
  @IsOptional()
  @IsString()
  clientName?: string;

  @ApiProperty({ required: false, description: 'Número de página', default: 1 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value) || 1)
  page?: number = 1;

  @ApiProperty({ required: false, description: 'Elementos por página', default: 10 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value) || 10)
  limit?: number = 10;
}