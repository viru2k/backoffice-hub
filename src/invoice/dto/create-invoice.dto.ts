import { IsOptional, IsString, IsNumber, IsDateString, IsEnum, IsArray, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InvoiceStatus, PaymentMethod } from '../entities/invoice.entity';
import { InvoiceItemType } from '../entities/invoice-item.entity';

export class CreateInvoiceItemDto {
  @ApiProperty({ enum: ['service', 'product'] })
  @IsEnum(['service', 'product'])
  itemType: InvoiceItemType;

  @ApiProperty({ description: 'ID del servicio o producto' })
  @IsNumber()
  itemId: number;

  @ApiProperty({ description: 'Descripción del item' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Cantidad' })
  @IsNumber()
  quantity: number;

  @ApiProperty({ description: 'Precio unitario' })
  @IsNumber()
  unitPrice: number;

  @ApiPropertyOptional({ description: 'Descuento aplicado' })
  @IsOptional()
  @IsNumber()
  discount?: number;

  @ApiPropertyOptional({ enum: ['percentage', 'fixed'] })
  @IsOptional()
  @IsEnum(['percentage', 'fixed'])
  discountType?: 'percentage' | 'fixed';

  @ApiPropertyOptional({ description: 'Notas del item' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateInvoiceDto {
  @ApiPropertyOptional({ description: 'ID de la consulta relacionada' })
  @IsOptional()
  @IsNumber()
  consultationId?: number;

  @ApiProperty({ description: 'ID del cliente' })
  @IsNumber()
  clientId: number;

  @ApiPropertyOptional({ description: 'Estado de la factura', enum: ['draft', 'pending', 'paid', 'cancelled', 'overdue'] })
  @IsOptional()
  @IsEnum(['draft', 'pending', 'paid', 'cancelled', 'overdue'])
  status?: InvoiceStatus;

  @ApiPropertyOptional({ description: 'Tasa de impuestos (%)' })
  @IsOptional()
  @IsNumber()
  taxRate?: number;

  @ApiPropertyOptional({ description: 'Descuento general' })
  @IsOptional()
  @IsNumber()
  discount?: number;

  @ApiPropertyOptional({ enum: ['percentage', 'fixed'] })
  @IsOptional()
  @IsEnum(['percentage', 'fixed'])
  discountType?: 'percentage' | 'fixed';

  @ApiPropertyOptional({ description: 'Método de pago', enum: ['cash', 'card', 'transfer', 'check', 'other'] })
  @IsOptional()
  @IsEnum(['cash', 'card', 'transfer', 'check', 'other'])
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Fecha de vencimiento' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Notas de la factura' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Notas del pago' })
  @IsOptional()
  @IsString()
  paymentNotes?: string;

  @ApiPropertyOptional({ description: 'Referencia del pago' })
  @IsOptional()
  @IsString()
  paymentReference?: string;

  @ApiProperty({ description: 'Items de la factura', type: [CreateInvoiceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];
}