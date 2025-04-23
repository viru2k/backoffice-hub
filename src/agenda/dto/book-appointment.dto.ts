import { IsDateString, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
}
