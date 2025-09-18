import { ApiProperty } from '@nestjs/swagger';
import { StockMovementResponseDto } from '../../stock/dto/stock-movement-response.dto';

export class RecentMovementsDto {
  @ApiProperty({ type: [StockMovementResponseDto] })
  movements: StockMovementResponseDto[];
}