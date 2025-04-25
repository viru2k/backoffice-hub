import { ApiProperty } from '@nestjs/swagger';

export class AgendaConfigResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  slotDurationMinutes: number;

  @ApiProperty()
  workStart: string;

  @ApiProperty()
  workEnd: string;

  @ApiProperty({ type: [Number] })
  workingDays: number[]; // ej: [1, 2, 3, 4, 5]

  @ApiProperty({ default: false })
  allowOverbooking: boolean;

  @ApiProperty({ default: false })
  allowBookingOnBlockedDays: boolean;
}
