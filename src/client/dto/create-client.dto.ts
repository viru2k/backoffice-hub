import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

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

  @ApiProperty({ enum: ['activo', 'inactivo', 'alta', 'baja'], default: 'activo' })
  @IsOptional()
  @IsEnum(['activo', 'inactivo', 'alta', 'baja'])
  status?: 'activo' | 'inactivo' | 'alta' | 'baja';

  @ApiProperty({ example: 'Paciente con historial de alergias', required: false })
  @IsOptional()
  notes?: string;
}
