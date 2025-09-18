import { ApiProperty } from '@nestjs/swagger';

export class TrendDto {
  @ApiProperty()
  trend: number; // porcentaje de cambio

  @ApiProperty()
  label: string; // descripción del cambio
}

export class TrendsDto {
  @ApiProperty({ type: TrendDto })
  products: TrendDto;

  @ApiProperty({ type: TrendDto })
  lowStock: TrendDto;

  @ApiProperty({ type: TrendDto })
  value: TrendDto;

  @ApiProperty({ type: TrendDto })
  movements: TrendDto;
}

export class InventoryDashboardMetricsDto {
  @ApiProperty()
  totalProducts: number;

  @ApiProperty()
  lowStockProducts: number;

  @ApiProperty()
  outOfStockProducts: number;

  @ApiProperty()
  overStockProducts: number;

  @ApiProperty()
  totalInventoryValue: number;

  @ApiProperty()
  movementsToday: number;

  @ApiProperty({ type: TrendsDto })
  trends: TrendsDto;
}