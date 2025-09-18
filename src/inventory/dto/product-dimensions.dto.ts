import { IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WeightUnit, DimensionUnit, VolumeUnit } from '../entities/product-dimensions.entity';

export class ProductDimensionsDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  productId: number;

  @ApiProperty()
  weight: number;

  @ApiProperty({ enum: WeightUnit })
  weightUnit: WeightUnit;

  @ApiProperty()
  length: number;

  @ApiProperty()
  width: number;

  @ApiProperty()
  height: number;

  @ApiProperty({ enum: DimensionUnit })
  dimensionUnit: DimensionUnit;

  @ApiPropertyOptional()
  volume?: number;

  @ApiProperty({ enum: VolumeUnit })
  volumeUnit: VolumeUnit;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class UpdateProductDimensionsDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  weight: number;

  @ApiProperty({ enum: WeightUnit })
  @IsEnum(WeightUnit)
  weightUnit: WeightUnit;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  length: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  width: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  height: number;

  @ApiProperty({ enum: DimensionUnit })
  @IsEnum(DimensionUnit)
  dimensionUnit: DimensionUnit;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  volume?: number;

  @ApiProperty({ enum: VolumeUnit })
  @IsEnum(VolumeUnit)
  volumeUnit: VolumeUnit;
}