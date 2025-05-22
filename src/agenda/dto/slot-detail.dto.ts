import { ApiProperty } from '@nestjs/swagger';

export class SlotDetailDto {
  @ApiProperty({ example: '10:00', description: 'Hora del slot en formato HH:mm' })
  time: string;

  @ApiProperty({ example: '2025-05-22T10:00:00.000Z', description: 'Fecha y hora de inicio del slot (ISO 8601)' })
  start: string;

  @ApiProperty({ example: '2025-05-22T10:30:00.000Z', description: 'Fecha y hora de fin del slot (ISO 8601)' })
  end: string;

  @ApiProperty({ example: true, description: 'Indica si el slot está disponible' })
  available: boolean;
}