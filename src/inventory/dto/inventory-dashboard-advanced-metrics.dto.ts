import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InventoryDashboardAdvancedMetricsDto {
  @ApiProperty()
  totalProducts: number;

  @ApiProperty()
  totalInventoryValue: number;

  @ApiProperty()
  totalActiveProducts: number;

  @ApiProperty()
  lowStockCount: number;

  @ApiProperty()
  outOfStockCount: number;

  @ApiProperty()
  averageProductValue: number;

  @ApiProperty()
  lastMonthMovements: number;

  @ApiProperty()
  inventoryTurnoverRate: number;

  @ApiProperty()
  totalMovementValue: number;

  @ApiProperty()
  criticalItemsCount: number;
}

export class AdvancedLowStockProductDto {
  @ApiProperty()
  productId: number;

  @ApiProperty()
  productName: string;

  @ApiProperty()
  currentStock: number;

  @ApiProperty()
  minStockLevel: number;

  @ApiProperty()
  reorderPoint: number;

  @ApiProperty()
  daysUntilStockout: number;

  @ApiProperty()
  suggestedReorderQuantity: number;

  @ApiProperty()
  lastMovementDate: Date;

  @ApiProperty()
  averageConsumptionRate: number;
}

export class TopMoversDto {
  @ApiProperty()
  productId: number;

  @ApiProperty()
  productName: string;

  @ApiProperty()
  totalMovements: number;

  @ApiProperty()
  inMovements: number;

  @ApiProperty()
  outMovements: number;

  @ApiProperty()
  adjustmentMovements: number;

  @ApiProperty()
  usageMovements: number;

  @ApiProperty()
  movementValue: number;

  @ApiProperty()
  turnoverRate: number;

  @ApiProperty({ enum: ['up', 'down', 'stable'] })
  trend: 'up' | 'down' | 'stable';
}

export class StockValueHistoryDto {
  @ApiProperty({ description: 'Period in format YYYY-MM' })
  period: string;

  @ApiProperty()
  totalValue: number;

  @ApiProperty()
  productCount: number;

  @ApiProperty()
  averageValue: number;

  @ApiProperty()
  monthOverMonthGrowth: number;
}

export class UserMovementStatsDto {
  @ApiProperty()
  userId: number;

  @ApiProperty()
  userName: string;

  @ApiProperty()
  totalMovements: number;

  @ApiProperty()
  lastActivity: Date;
}

export class DailyActivityDto {
  @ApiProperty({ description: 'Date in YYYY-MM-DD format' })
  date: string;

  @ApiProperty()
  totalMovements: number;

  @ApiProperty()
  totalValue: number;
}

export class MovementAnalysisDto {
  @ApiProperty()
  totalMovements: number;

  @ApiProperty()
  movementsByType: {
    in: number;
    out: number;
    adjustment: number;
    usage: number;
  };

  @ApiProperty({ type: [UserMovementStatsDto] })
  topUsers: UserMovementStatsDto[];

  @ApiProperty({ type: [DailyActivityDto] })
  dailyActivity: DailyActivityDto[];

  @ApiProperty()
  averageMovementValue: number;
}