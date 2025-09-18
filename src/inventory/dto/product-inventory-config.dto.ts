import { IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductInventoryConfigDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  productId: number;

  @ApiProperty()
  reorderPoint: number;

  @ApiProperty()
  maxStockLevel: number;

  @ApiProperty()
  minStockLevel: number;

  @ApiProperty()
  currentStock: number;

  @ApiProperty()
  reservedStock: number;

  @ApiProperty()
  averageCost: number;

  @ApiProperty()
  lastCost: number;

  @ApiPropertyOptional()
  supplierId?: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class UpdateProductInventoryConfigDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  reorderPoint: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  maxStockLevel: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  minStockLevel: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  currentStock: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  reservedStock: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  averageCost: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  lastCost: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  supplierId?: number;

  @ApiProperty()
  @IsBoolean()
  isActive: boolean;
}