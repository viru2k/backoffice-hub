import { ApiProperty } from '@nestjs/swagger';

export class HolidayResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  date: string; // 'YYYY-MM-DD'

  @ApiProperty({ required: false })
  description?: string;
}
