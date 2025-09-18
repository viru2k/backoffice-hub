import { ApiProperty } from '@nestjs/swagger';
import { ClientStatus } from '../entities/client.entity';


export class ClientResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  fullname: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ required: false })
  address?: string;

  @ApiProperty({ required: false })
  email?: string;

  @ApiProperty({ required: false })
  membershipNumber?: string;

  @ApiProperty({ required: false })
  phone?: string;

  @ApiProperty({ enum: ['male', 'female', 'other'], required: false })
  gender?: 'male' | 'female' | 'other';

  @ApiProperty({ required: false })
  birthDate?: string;

  @ApiProperty({ enum: ['DNI', 'NIE', 'PASAPORTE'], required: false, description: 'Tipo de documento de identidad' })
  dniType?: 'DNI' | 'NIE' | 'PASAPORTE';

  @ApiProperty({ required: false, description: 'Número de documento de identidad' })
  dniNumber?: string;

 @ApiProperty({
    enum: ClientStatus,
    description: 'Estado actual del cliente',
    example: ClientStatus.ACTIVE,
  })
  status: ClientStatus;

  @ApiProperty({ required: false })
  notes?: string;

  @ApiProperty({ required: false, description: 'Avatar URL or null if no image' })
  avatarUrl?: string;

  @ApiProperty({ description: 'Indicates if client is active (soft delete)' })
  isActive: boolean;

  @ApiProperty({ required: false, description: 'Date when client was deactivated' })
  deactivatedAt?: string;

  @ApiProperty({ required: false, description: 'Reason for deactivation' })
  deactivationReason?: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
