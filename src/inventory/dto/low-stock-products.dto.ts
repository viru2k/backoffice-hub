import { ApiProperty } from '@nestjs/swagger';

export class LowStockProductDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  currentStock: number;

  @ApiProperty()
  minStock: number;

  @ApiProperty({ enum: ['warning', 'danger'] })
  status: 'warning' | 'danger'; // warning: stock bajo, danger: sin stock
}

export class LowStockProductsDto {
  @ApiProperty({ type: [LowStockProductDto] })
  products: LowStockProductDto[];
}