import { ApiProperty } from '@nestjs/swagger';

export class StockMovementResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  productId: number;

  @ApiProperty()
  productNameAtTime: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty({ enum: ['in', 'out', 'adjustment', 'usage'] })
  type: 'in' | 'out' | 'adjustment' | 'usage';

  @ApiProperty({ required: false })
  reason?: string;

  @ApiProperty()
  createdAt: string;
}
