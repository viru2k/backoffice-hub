import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductResponseDto } from '../../product/dto/product-response.dto';
import { ProductDimensionsDto } from './product-dimensions.dto';
import { ProductPackagingDto } from './product-packaging.dto';
import { ProductInventoryConfigDto } from './product-inventory-config.dto';

export enum StockLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  OUT = 'out'
}

export class ExtendedProductResponseDto extends ProductResponseDto {
  @ApiPropertyOptional()
  dimensions?: ProductDimensionsDto;

  @ApiPropertyOptional()
  packaging?: ProductPackagingDto;

  @ApiPropertyOptional()
  inventoryConfig?: ProductInventoryConfigDto;

  @ApiProperty({ enum: StockLevel })
  stockLevel: StockLevel;

  @ApiPropertyOptional()
  daysUntilStockout?: number;

  @ApiPropertyOptional()
  turnoverRate?: number;

  @ApiProperty()
  availableStock: number;

  @ApiPropertyOptional()
  suggestedReorderQuantity?: number;

  @ApiPropertyOptional()
  stockValue?: number;
}