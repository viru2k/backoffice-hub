import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class OperationResultDto {
  @ApiProperty({ description: 'Indica si la operación fue exitosa' })
  @Expose()
  success: boolean;

  @ApiProperty({ description: 'Mensaje descriptivo del resultado' })
  @Expose()
  message: string;

  @ApiProperty({ description: 'Timestamp de cuando ocurrió la operación', required: false })
  @Expose()
  timestamp?: string;

  constructor(message: string, success: boolean = true) {
    this.success = success;
    this.message = message;
    this.timestamp = new Date().toISOString();
  }
}

export class TriggerOperationResultDto extends OperationResultDto {
  @ApiProperty({ description: 'ID del cliente afectado', required: false })
  @Expose()
  clientId?: number;

  @ApiProperty({ description: 'Tipo de acción que se ejecutó', required: false })
  @Expose()
  actionType?: string;

  constructor(message: string, clientId?: number, actionType?: string) {
    super(message);
    this.clientId = clientId;
    this.actionType = actionType;
  }
}

export class PurchaseOperationResultDto extends TriggerOperationResultDto {
  @ApiProperty({ description: 'Monto de la compra', required: false })
  @Expose()
  amount?: number;

  constructor(message: string, clientId?: number, amount?: number) {
    super(message, clientId, 'purchase');
    this.amount = amount;
  }
}