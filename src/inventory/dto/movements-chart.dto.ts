import { ApiProperty } from '@nestjs/swagger';

export class MovementsChartDto {
  @ApiProperty({ type: [String] })
  labels: string[]; // ['Lun', 'Mar', 'Mié', ...]

  @ApiProperty({ type: [Number] })
  entriesData: number[]; // datos de entradas por día

  @ApiProperty({ type: [Number] })
  exitsData: number[]; // datos de salidas por día
}