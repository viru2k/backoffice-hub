import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class AdminUpdateUserDto {
  @ApiPropertyOptional({ description: 'Nombre completo del usuario', example: 'Juan Pérez' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ description: 'Habilitar o deshabilitar la cuenta del usuario', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Permiso para gestionar la agenda', example: true })
  @IsOptional()
  @IsBoolean()
  canManageAgenda?: boolean;

  @ApiPropertyOptional({ description: 'Permiso para gestionar clientes', example: true })
  @IsOptional()
  @IsBoolean()
  canManageClients?: boolean;

  @ApiPropertyOptional({ description: 'Permiso para gestionar productos', example: true })
  @IsOptional()
  @IsBoolean()
  canManageProducts?: boolean;

}