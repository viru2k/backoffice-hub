import { ApiProperty } from '@nestjs/swagger';

export class AvailableSlotResponseDto {
  @ApiProperty()
  start: string; // ISO Date

  @ApiProperty()
  end: string;   // ISO Date
}
