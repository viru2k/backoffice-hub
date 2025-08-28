import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsArray, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateAgendaConfigDto {
  @ApiProperty({ example: '09:00' })
  @IsString()
  startTime: string;

  @ApiProperty({ example: '18:00' })
  @IsString()
  endTime: string;

  @ApiProperty({ example: 45 })
  @Type(() => Number)
  @IsNumber()
  @Min(5)
  @Max(120)
  slotDuration: number;

  @ApiProperty({ example: false })
  @Type(() => Boolean)
  @IsBoolean()
  overbookingAllowed: boolean;

  @ApiProperty({ example: false })
  @Type(() => Boolean)
  @IsBoolean()
  allowBookingOnBlockedDays: boolean;

  @ApiProperty({ example: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] })
  @IsArray()
  @IsIn(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], { each: true })
  workingDays: string[];
}
