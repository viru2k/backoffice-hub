import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, Min, MaxLength, IsPositive } from 'class-validator';
import { ServiceStatus } from '../entities/service.entity';

export class CreateServiceDto {
  @ApiProperty({ example: 'Corte de cabello' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'Corte de cabello profesional', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'Peluquería', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiProperty({ example: 25.99 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  basePrice: number;

  @ApiProperty({ example: 30, description: 'Duration in minutes', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  duration?: number;

  @ApiProperty({ example: 'ACTIVE', enum: ServiceStatus, required: false })
  @IsOptional()
  @IsEnum(ServiceStatus)
  status?: ServiceStatus;

  @ApiProperty({ example: 'Notas adicionales sobre el servicio', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}