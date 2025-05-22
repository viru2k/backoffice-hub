import { ApiProperty } from '@nestjs/swagger';

export class StockSummaryResponseDto {
  @ApiProperty()
  productId: number;

  @ApiProperty()
  productName: string; // Changed from productNameAtTime for clarity

  @ApiProperty({ required: false })
  productDescription?: string;

  @ApiProperty()
  productCurrentPrice: number;

  @ApiProperty({ enum: ['activo', 'inactivo', 'descatalogado', 'agotado', 'suspendido'] })
  productStatus: string;

  @ApiProperty()
  availableStock: number; // Changed from totalStock for clarity
}