import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsPositive, ValidateIf } from 'class-validator';

export class CreateStockMovementDto {
  @ApiProperty()
  @IsInt()
  productId: number;

  @ApiProperty({ description: 'Cantidad (positiva para in/out/usage, puede ser negativa para adjustment)' })
  @IsInt()
  @ValidateIf((o) => o.type !== 'adjustment')
  @IsPositive({ message: 'La cantidad debe ser positiva para movimientos de entrada, salida y uso' })
  quantity: number;

  @ApiProperty({ enum: ['in', 'out', 'adjustment', 'usage'] })
  @IsEnum(['in', 'out', 'adjustment', 'usage'])
  type: 'in' | 'out' | 'adjustment' | 'usage';

  @ApiProperty({ required: false })
  @IsOptional()
  reason?: string;
}
