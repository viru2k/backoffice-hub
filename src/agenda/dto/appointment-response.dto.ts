import { ApiProperty } from '@nestjs/swagger';

export class AppointmentResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  date: string;

  @ApiProperty({ enum: ['pending', 'confirmed', 'checked_in', 'in_progress', 'cancelled', 'completed', 'no_show'] })
  status: string;

  @ApiProperty({ required: false })
  clientId?: number;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
