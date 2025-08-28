import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsArray, ValidateNested, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';
import { RoleDto } from '../../roles/dto/role.dto';

export class AdminUpdateUserDto {
  @ApiPropertyOptional({ description: 'Nombre completo del usuario', example: 'Juan Pérez' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ description: 'Email del usuario', example: 'nuevo@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Habilitar o deshabilitar la cuenta del usuario', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Es administrador del grupo', example: false })
  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;

  @ApiPropertyOptional({ description: 'Array de objetos de rol a asignar al usuario', type: () => RoleDto, isArray: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoleDto)
  roles?: RoleDto[];
}