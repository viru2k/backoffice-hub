import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InvoiceStatus, PaymentMethod } from '../entities/invoice.entity';
import { InvoiceItemType } from '../entities/invoice-item.entity';

export class InvoiceItemResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: ['service', 'product'] })
  itemType: InvoiceItemType;

  @ApiProperty()
  itemId: number;

  @ApiProperty()
  description: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unitPrice: number;

  @ApiProperty()
  discount: number;

  @ApiProperty({ enum: ['percentage', 'fixed'] })
  discountType: 'percentage' | 'fixed';

  @ApiProperty()
  total: number;

  @ApiPropertyOptional()
  notes?: string;

  @ApiPropertyOptional()
  product?: {
    id: number;
    name: string;
    sku: string;
    price: number;
  };

  @ApiPropertyOptional()
  service?: {
    id: number;
    name: string;
    price: number;
    duration: number;
  };
}

export class InvoiceResponseDto {
  @ApiProperty()
  id: number;

  @ApiPropertyOptional()
  consultationId?: number;

  @ApiProperty()
  clientId: number;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  invoiceNumber: string;

  @ApiProperty({ enum: ['draft', 'pending', 'paid', 'cancelled', 'overdue'] })
  status: InvoiceStatus;

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  tax: number;

  @ApiProperty()
  taxRate: number;

  @ApiProperty()
  discount: number;

  @ApiProperty({ enum: ['percentage', 'fixed'] })
  discountType: 'percentage' | 'fixed';

  @ApiProperty()
  total: number;

  @ApiPropertyOptional({ enum: ['cash', 'card', 'transfer', 'check', 'other'] })
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional()
  paymentDate?: Date;

  @ApiPropertyOptional()
  dueDate?: Date;

  @ApiPropertyOptional()
  notes?: string;

  @ApiPropertyOptional()
  paymentNotes?: string;

  @ApiPropertyOptional()
  paymentReference?: string;

  @ApiProperty()
  isPaid: boolean;

  @ApiProperty()
  paidAmount: number;

  @ApiProperty()
  remainingAmount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  client?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };

  @ApiPropertyOptional()
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };

  @ApiPropertyOptional()
  consultation?: {
    id: number;
    consultationNumber: string;
    status: string;
    createdAt: Date;
  };

  @ApiProperty({ type: [InvoiceItemResponseDto] })
  items: InvoiceItemResponseDto[];
}