import { IsString, IsNumber, IsOptional, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductPackagingDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  productId: number;

  @ApiProperty()
  baseUnit: string;

  @ApiProperty()
  unitsPerPackage: number;

  @ApiProperty()
  packageType: string;

  @ApiProperty()
  minOrderQuantity: number;

  @ApiPropertyOptional()
  storageRequirements?: string;

  @ApiPropertyOptional()
  expirationMonths?: number;

  @ApiPropertyOptional()
  barcode?: string;

  @ApiProperty()
  internalSku: string;

  @ApiPropertyOptional()
  supplierSku?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class UpdateProductPackagingDto {
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  baseUnit: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  unitsPerPackage: number;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  packageType: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  minOrderQuantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  storageRequirements?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  expirationMonths?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  barcode?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(50)
  internalSku: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  supplierSku?: string;
}