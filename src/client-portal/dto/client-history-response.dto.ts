import { ApiProperty } from '@nestjs/swagger';

export class ClientServiceHistoryDto {
  @ApiProperty({ description: 'ID del servicio' })
  serviceId: number;

  @ApiProperty({ description: 'Fecha del servicio' })
  serviceDate: Date;

  @ApiProperty({ description: 'Tipo de servicio realizado' })
  serviceType: string;

  @ApiProperty({ description: 'Descripción del servicio' })
  description?: string;

  @ApiProperty({ description: 'Profesional que atendió' })
  professional: {
    id: number;
    name: string;
  };

  @ApiProperty({ description: 'Duración del servicio en minutos', required: false })
  durationMinutes?: number;

  @ApiProperty({ description: 'Costo del servicio', required: false })
  cost?: number;

  @ApiProperty({ description: 'Notas del profesional', required: false })
  professionalNotes?: string;

  @ApiProperty({ description: 'Estado del servicio' })
  status: string;
}

export class ClientInvoiceHistoryDto {
  @ApiProperty({ description: 'ID de la factura' })
  invoiceId: number;

  @ApiProperty({ description: 'Número de factura' })
  invoiceNumber: string;

  @ApiProperty({ description: 'Fecha de la factura' })
  invoiceDate: Date;

  @ApiProperty({ description: 'Total de la factura' })
  total: number;

  @ApiProperty({ description: 'Estado de pago' })
  paymentStatus: string;

  @ApiProperty({ description: 'Servicios incluidos' })
  services: {
    serviceType: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];

  @ApiProperty({ description: 'Descuentos aplicados', required: false })
  discounts?: {
    description: string;
    amount: number;
  }[];
}

export class ClientCompleteHistoryDto {
  @ApiProperty({ description: 'Historial de servicios', type: [ClientServiceHistoryDto] })
  services: ClientServiceHistoryDto[];

  @ApiProperty({ description: 'Historial de facturas', type: [ClientInvoiceHistoryDto] })
  invoices: ClientInvoiceHistoryDto[];

  @ApiProperty({ description: 'Estadísticas del cliente' })
  stats: {
    totalServices: number;
    totalSpent: number;
    averageServiceCost: number;
    lastServiceDate?: Date;
    favoriteServiceType?: string;
    totalVisits: number;
  };

  @ApiProperty({ description: 'Paginación' })
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}