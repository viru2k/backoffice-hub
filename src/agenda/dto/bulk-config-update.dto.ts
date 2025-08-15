import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsIn, IsString, IsInt, Min, Max, IsOptional } from 'class-validator';

export class BulkConfigUpdateDto {
  @ApiProperty({ 
    example: ["2024-12-01", "2024-12-31"], 
    description: 'Rango de fechas para aplicar la configuración (YYYY-MM-DD)' 
  })
  @IsArray()
  @IsString({ each: true })
  dateRange: string[];

  @ApiProperty({ example: '09:00', required: false })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiProperty({ example: '17:00', required: false })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiProperty({ example: 30, required: false })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(120)
  slotDuration?: number;

  @ApiProperty({ example: ['monday', 'tuesday', 'wednesday'], required: false })
  @IsOptional()
  @IsArray()
  @IsIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'], { each: true })
  workingDays?: string[];

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  overbookingAllowed?: boolean;
}