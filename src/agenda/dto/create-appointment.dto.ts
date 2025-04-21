import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty({ example: 'Reunión con proveedor' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: '2025-05-10T10:30:00Z' })
  @IsDateString()
  date: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
