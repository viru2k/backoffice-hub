import { IsNumber, IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '../entities/invoice.entity';

export class ProcessPaymentDto {
  @ApiProperty({ description: 'Monto pagado' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Método de pago', enum: ['cash', 'card', 'transfer', 'check', 'other'] })
  @IsEnum(['cash', 'card', 'transfer', 'check', 'other'])
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ description: 'Fecha del pago' })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @ApiPropertyOptional({ description: 'Referencia del pago' })
  @IsOptional()
  @IsString()
  paymentReference?: string;

  @ApiPropertyOptional({ description: 'Notas del pago' })
  @IsOptional()
  @IsString()
  paymentNotes?: string;
}