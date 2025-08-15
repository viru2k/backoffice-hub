import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, IsInt, Min, Max, IsOptional, IsBoolean } from 'class-validator';

export class DayOverrideDto {
  @ApiProperty({ 
    example: "2024-12-24", 
    description: 'Fecha específica para override (YYYY-MM-DD)' 
  })
  @IsDateString()
  date: string;

  @ApiProperty({ example: '10:00', required: false })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiProperty({ example: '14:00', required: false })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiProperty({ example: 60, required: false })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(120)
  slotDuration?: number;

  @ApiProperty({ example: false, description: 'Si está bloqueado completamente', required: false })
  @IsOptional()
  @IsBoolean()
  blocked?: boolean;

  @ApiProperty({ example: "Horario especial víspera navidad", required: false })
  @IsOptional()
  @IsString()
  note?: string;
}