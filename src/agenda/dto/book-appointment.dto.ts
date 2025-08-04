import { IsDateString, IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BookAppointmentDto {
  @ApiProperty({ example: '2025-05-15' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: '08:15' })
  @IsString()
  @IsNotEmpty()
  time: string;

  @ApiProperty({ example: 'Consulta médica' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Chequeo general', required: false })
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'ID del profesional para quien se reserva el turno (opcional, si no es el usuario logueado)', example: 2 })
  @IsOptional()
  @IsNumber()
  professionalId?: number;

  @ApiPropertyOptional({ description: 'ID del cliente para quien se reserva el turno (opcional)', example: 1 })
  @IsOptional()
  @IsNumber()
  clientId?: number;
}
