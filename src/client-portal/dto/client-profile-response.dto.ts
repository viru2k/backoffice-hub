import { ApiProperty } from '@nestjs/swagger';
import { ClientStatus } from '../../client/entities/client.entity';

export class ClientProfileResponseDto {
  @ApiProperty({ description: 'ID del cliente' })
  id: number;

  // === DATOS BÁSICOS (SOLO LECTURA PARA CLIENTE) ===
  @ApiProperty({ description: 'Nombre registrado por el administrador' })
  name: string;

  @ApiProperty({ description: 'Apellido registrado por el administrador' })
  lastName?: string;

  @ApiProperty({ description: 'Nombre completo (auto-generado)' })
  fullname: string;

  @ApiProperty({ description: 'Email registrado (solo lectura)' })
  email?: string;

  @ApiProperty({ description: 'Teléfono registrado (solo lectura)' })
  phone?: string;

  @ApiProperty({ description: 'Número de membresía único' })
  membershipNumber?: string;

  @ApiProperty({ description: 'Estado de la cuenta', enum: ClientStatus })
  status: ClientStatus;

  // === DATOS EDITABLES POR CLIENTE ===
  @ApiProperty({ description: 'Nombre que prefiere el cliente', required: false })
  preferredName?: string;

  @ApiProperty({ description: 'Dirección del cliente', required: false })
  address?: string;

  @ApiProperty({ description: 'Género', required: false })
  gender?: 'male' | 'female' | 'other';

  @ApiProperty({ description: 'Fecha de nacimiento', required: false })
  birthDate?: Date;

  @ApiProperty({ description: 'Notas personales del cliente', required: false })
  personalNotes?: string;

  @ApiProperty({ description: 'URL del avatar', required: false })
  avatarUrl?: string;

  // === INFORMACIÓN DEL PORTAL ===
  @ApiProperty({ description: 'Tiene acceso al portal de clientes' })
  hasPortalAccess: boolean;

  @ApiProperty({ description: 'Último login', required: false })
  lastLogin?: Date;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Última actualización' })
  updatedAt: Date;
}

export class ClientProfileSummaryDto {
  @ApiProperty({ description: 'Nombre a mostrar (preferido o registrado)' })
  displayName: string;

  @ApiProperty({ description: 'Email' })
  email?: string;

  @ApiProperty({ description: 'Teléfono' })
  phone?: string;

  @ApiProperty({ description: 'Número de membresía' })
  membershipNumber?: string;

  @ApiProperty({ description: 'Avatar' })
  avatarUrl?: string;

  @ApiProperty({ description: 'Estado de la cuenta' })
  status: ClientStatus;
}