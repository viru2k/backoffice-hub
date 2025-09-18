import { IsOptional, IsString, IsEnum, IsDateString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ClientProfileUpdateDto {
  @ApiProperty({ 
    description: 'Nombre preferido por el cliente para mostrar',
    example: 'Juan Carlos',
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  preferredName?: string;

  @ApiProperty({ 
    description: 'Dirección del cliente',
    example: 'Av. Principal 123, Ciudad',
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @ApiProperty({ 
    description: 'Género del cliente',
    enum: ['male', 'female', 'other'],
    required: false
  })
  @IsOptional()
  @IsEnum(['male', 'female', 'other'])
  gender?: 'male' | 'female' | 'other';

  @ApiProperty({ 
    description: 'Fecha de nacimiento',
    example: '1990-05-15',
    required: false
  })
  @IsOptional()
  @IsDateString()
  birthDate?: Date;

  @ApiProperty({ 
    description: 'Notas personales del cliente',
    example: 'Prefiero citas por la mañana',
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  personalNotes?: string;

  @ApiProperty({ 
    description: 'URL del avatar/foto de perfil',
    example: 'https://example.com/avatar.jpg',
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;
}

export class ClientPasswordUpdateDto {
  @ApiProperty({ description: 'Contraseña actual' })
  @IsString()
  @MinLength(1)
  currentPassword: string;

  @ApiProperty({ description: 'Nueva contraseña' })
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  newPassword: string;
}