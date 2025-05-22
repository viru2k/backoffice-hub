import { ApiProperty } from '@nestjs/swagger';

export class AppointmentSummaryResponseDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  pending: number;

  @ApiProperty()
  confirmed: number;

  @ApiProperty()
  checkedIn: number; // Asegúrate que este nombre de propiedad coincida con lo que espera el frontend

  @ApiProperty()
  inProgress: number; // Asegúrate que este nombre de propiedad coincida con lo que espera el frontend

  @ApiProperty()
  completed: number;

  @ApiProperty()
  cancelled: number;

  @ApiProperty()
  noShow: number;

  // Opcional: Si también quieres devolver el desglose por fecha
   @ApiProperty({ type: 'object', additionalProperties: { type: 'number' }, example: { '2025-05-22': 5, '2025-05-23': 3 }})
   byDate?: Record<string, number>;
}