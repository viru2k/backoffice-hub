import { ApiProperty } from '@nestjs/swagger';
import { PermissionResponseDto } from '../../permissions/dto/permission-response.dto';

export class RoleResponseDto {
  @ApiProperty({ description: 'ID del rol', example: 1 })
  id: number;

  @ApiProperty({ description: 'Nombre del rol', example: 'Admin de Cuenta' })
  name: string;

  @ApiProperty({ description: 'Descripción del rol', example: 'Acceso total a la cuenta.' })
  description: string;

  @ApiProperty({ type: [PermissionResponseDto], description: 'Lista de permisos asociados a este rol' })
  permissions: PermissionResponseDto[];
}