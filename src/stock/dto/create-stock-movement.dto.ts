import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateStockMovementDto {
  @ApiProperty()
  @IsInt()
  productId: number;

  @ApiProperty()
  @IsInt()
  quantity: number;

  @ApiProperty({ enum: ['in', 'out', 'adjustment', 'usage'] })
  @IsEnum(['in', 'out', 'adjustment', 'usage'])
  type: 'in' | 'out' | 'adjustment' | 'usage';

  @ApiProperty({ required: false })
  @IsOptional()
  reason?: string;
}
