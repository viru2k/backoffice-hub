import { ApiProperty } from '@nestjs/swagger';

export class PermissionResponseDto {
  @ApiProperty({ description: 'ID del permiso', example: 1 })
  id: number;

  @ApiProperty({ description: 'Nombre del permiso (recurso:acción:ámbito)', example: 'user:manage:group' })
  name: string;

  @ApiProperty({ description: 'Descripción del permiso', example: 'Crear/editar/eliminar sub-usuarios del grupo' })
  description: string;
}