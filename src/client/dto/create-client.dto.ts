import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ClientStatus } from '../entities/client.entity';

export class CreateClientDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsNotEmpty()
  fullname: string;

  @ApiProperty({ example: 'Juan' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Pérez' })
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'Calle Falsa 123', required: false })
  @IsOptional()
  address?: string;

  @ApiProperty({ example: 'juan.perez@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'ORB-20240101-1234', required: false })
  @IsOptional()
  @IsString()
  membershipNumber?: string;

  @ApiProperty({ example: '+54 9 11 1234-5678', required: false })
  @IsOptional()
  phone?: string;

  @ApiProperty({ enum: ['male', 'female', 'other'], required: false })
  @IsOptional()
  @IsEnum(['male', 'female', 'other'])
  gender?: 'male' | 'female' | 'other';

  @ApiProperty({ example: '1990-05-15', required: false })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiProperty({ enum: ['DNI', 'NIE', 'PASAPORTE'], required: false })
  @IsOptional()
  @IsEnum(['DNI', 'NIE', 'PASAPORTE'])
  dniType?: 'DNI' | 'NIE' | 'PASAPORTE';

  @ApiProperty({ example: '12345678A', required: false })
  @IsOptional()
  @IsString()
  dniNumber?: string;

  @ApiPropertyOptional({
    enum: ClientStatus,
    default: ClientStatus.CREATED,
  })
  @IsOptional()
  @IsEnum(ClientStatus)
  status?: ClientStatus; 

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
