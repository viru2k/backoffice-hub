import { ApiProperty } from '@nestjs/swagger';
import { ServiceResponseDto } from './service-response.dto';

export class ServiceListResponseDto {
  @ApiProperty({ type: [ServiceResponseDto] })
  services: ServiceResponseDto[];

  @ApiProperty({ example: 25, description: 'Total number of services' })
  total: number;

  @ApiProperty({ example: 1, description: 'Current page number' })
  page: number;

  @ApiProperty({ example: 10, description: 'Items per page' })
  limit: number;

  @ApiProperty({ example: 3, description: 'Total number of pages' })
  totalPages: number;
}