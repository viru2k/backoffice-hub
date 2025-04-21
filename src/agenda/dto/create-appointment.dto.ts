import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty({ example: 'Consulta médica' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: '2025-05-10T10:30:00Z' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 'Chequeo general', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
