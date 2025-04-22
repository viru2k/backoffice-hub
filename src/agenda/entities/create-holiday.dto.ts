import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateHolidayDto {
  @ApiProperty({ example: '2025-12-25' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 'Navidad', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
