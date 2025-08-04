import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../roles/entities/role.entity';

class RoleDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Admin de Cuenta' })
  name: string;

  @ApiProperty({ example: 'Acceso total a la cuenta.' })
  description: string;
}

export class ProfileResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'peluqueria@glamour.com' })
  email: string;

  @ApiProperty({ example: 'Admin' })
  name: string;

  @ApiProperty({ example: 'Glamour' })
  lastName: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ type: () => [RoleDto] })
  roles: Role[];

  // --- PROPERTIES ADDED BACK ---

  @ApiProperty({ description: 'Indica si el usuario puede gestionar la agenda.' })
  canManageAgenda: boolean;

  @ApiProperty({ description: 'Indica si el usuario puede gestionar clientes.' })
  canManageClients: boolean;

  @ApiProperty({ description: 'Indica si el usuario puede gestionar productos.' })
  canManageProducts: boolean;

  @ApiProperty({ description: 'Indica si el usuario puede gestionar otros usuarios.' })
  canManageUsers: boolean;

  @ApiProperty({ description: 'Fecha de creación.' })
  createdAt: string;

  @ApiProperty({ description: 'Fecha de última actualización.' })
  updatedAt: string;
}