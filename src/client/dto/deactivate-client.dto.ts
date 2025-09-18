import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class DeactivateClientDto {
  @ApiProperty({
    description: 'Reason for deactivating the client',
    required: false,
    example: 'Client requested account deactivation'
  })
  @IsString()
  @IsOptional()
  reason?: string;
}