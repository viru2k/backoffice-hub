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
  phone?: string;

  @ApiProperty({ enum: ['male', 'female', 'other'], required: false })
  gender?: 'male' | 'female' | 'other';

  @ApiProperty({ required: false })
  birthDate?: string;

 @ApiProperty({ 
    enum: ClientStatus, 
    description: 'Estado actual del cliente',
    example: ClientStatus.ACTIVE,
  })
  status: ClientStatus;

  @ApiProperty({ required: false })
  notes?: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
