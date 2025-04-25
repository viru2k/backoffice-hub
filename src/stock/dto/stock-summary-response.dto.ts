import { ApiProperty } from '@nestjs/swagger';

export class StockSummaryResponseDto {
  @ApiProperty()
  productId: number;

  @ApiProperty()
  productNameAtTime: string;

  @ApiProperty()
  totalStock: number;
}
