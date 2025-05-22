import { ApiProperty } from '@nestjs/swagger';
import { SlotDetailDto } from './slot-detail.dto'; // Importar el nuevo DTO

export class AvailableSlotResponseDto { // Este es ahora el DTO contenedor
  @ApiProperty({ example: '2025-05-22', description: 'Fecha para la cual se listan los slots' })
  date: string;

  @ApiProperty({ type: [SlotDetailDto], description: 'Lista de slots disponibles y no disponibles para el día' })
  slots: SlotDetailDto[];

  @ApiProperty({ example: 'Día bloqueado', required: false, description: 'Mensaje adicional (ej. si el día está bloqueado)' })
  message?: string;
}