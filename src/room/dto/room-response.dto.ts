import { ApiProperty } from '@nestjs/swagger';

export class RoomOwnerResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'admin@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe' })
  fullName: string;
}

export class RoomResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Sala de Consulta 1' })
  name: string;

  @ApiProperty({ example: 'Sala principal para consultas', required: false })
  description?: string;

  @ApiProperty({ example: 4, required: false })
  capacity?: number;

  @ApiProperty({ example: 'Planta baja', required: false })
  location?: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ type: RoomOwnerResponseDto })
  owner: RoomOwnerResponseDto;

  @ApiProperty({ example: '2024-01-15T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:00:00Z' })
  updatedAt: Date;
}