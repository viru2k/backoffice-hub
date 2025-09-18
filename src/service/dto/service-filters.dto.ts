import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceStatus } from '../entities/service.entity';

export class ServiceFiltersDto {
  @ApiProperty({ example: 'Corte', description: 'Search in name and description', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ example: 'Peluquería', description: 'Filter by category', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ example: 'ACTIVE', enum: ServiceStatus, description: 'Filter by status', required: false })
  @IsOptional()
  @IsEnum(ServiceStatus)
  status?: ServiceStatus;

  @ApiProperty({ example: 1, description: 'Page number', required: false, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ example: 10, description: 'Items per page', required: false, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}