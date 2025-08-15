import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDateString, IsOptional, IsString } from 'class-validator';

export class BlockDatesDto {
  @ApiProperty({ 
    example: ["2024-12-24", "2024-12-25", "2024-12-26"], 
    description: 'Array de fechas a bloquear (YYYY-MM-DD)' 
  })
  @IsArray()
  @IsDateString({}, { each: true })
  dates: string[];

  @ApiProperty({ 
    example: "Vacaciones de Navidad", 
    description: 'Razón del bloqueo',
    required: false 
  })
  @IsOptional()
  @IsString()
  reason?: string;
}