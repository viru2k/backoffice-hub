import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty({ example: 'Recordatorio de turno' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'Tenés un turno mañana a las 14:30' })
  @IsNotEmpty()
  @IsString()
  message: string;
}
