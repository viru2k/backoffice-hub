import { ApiProperty } from '@nestjs/swagger';

export class ItemSelectorResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'product', enum: ['product', 'service'] })
  type: 'product' | 'service';

  @ApiProperty({ example: 'Corte de cabello' })
  name: string;

  @ApiProperty({ example: 'Descripción del producto o servicio', required: false })
  description?: string;

  @ApiProperty({ example: 'Peluquería', required: false })
  category?: string;

  @ApiProperty({ example: 25.99 })
  price: number;

  @ApiProperty({ example: 30, description: 'Duration in minutes for services', required: false })
  duration?: number;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;

  @ApiProperty({ example: 'https://example.com/image.jpg', required: false })
  thumbnailUrl?: string;
}