import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsArray, IsIn, IsString, IsInt, Min, Max } from 'class-validator';

export class UpdateAgendaConfigDto {
  @ApiProperty({ example: '08:00' })
  @IsString()
  startTime: string;

  @ApiProperty({ example: '16:00' })
  @IsString()
  endTime: string;

  @ApiProperty({ example: 15 })
  @IsInt()
  @Min(5)
  @Max(60)
  slotDuration: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  overbookingAllowed: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  allowBookingOnBlockedDays: boolean;

  @ApiProperty({ example: ['monday', 'tuesday', 'wednesday'] })
  @IsArray()
  @IsIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'], { each: true })
  workingDays: string[];
}
