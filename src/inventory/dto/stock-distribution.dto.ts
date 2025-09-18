import { ApiProperty } from '@nestjs/swagger';

export class StockDistributionDto {
  @ApiProperty()
  normal: number; // productos con stock normal

  @ApiProperty()
  low: number; // productos con stock bajo

  @ApiProperty()
  empty: number; // productos sin stock

  @ApiProperty()
  over: number; // productos con sobrestock
}