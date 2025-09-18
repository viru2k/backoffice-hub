import { ApiProperty } from '@nestjs/swagger';

export class ServiceOwnerResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'admin@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe' })
  fullName: string;
}

export class ServiceResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Corte de cabello' })
  name: string;

  @ApiProperty({ example: 'Corte de cabello profesional', required: false })
  description?: string;

  @ApiProperty({ example: 'Peluquería', required: false })
  category?: string;

  @ApiProperty({ example: 25.99 })
  basePrice: number;

  @ApiProperty({ example: 30, required: false })
  duration?: number;

  @ApiProperty({ example: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE'] })
  status: string;

  @ApiProperty({ example: 'https://example.com/image.jpg', required: false })
  thumbnailUrl?: string;

  @ApiProperty({ example: 'Notas adicionales', required: false })
  notes?: string;

  @ApiProperty({ example: 1 })
  ownerId: number;

  @ApiProperty({ example: '2024-01-15T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:00:00Z' })
  updatedAt: Date;
}