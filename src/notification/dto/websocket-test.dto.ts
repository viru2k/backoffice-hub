import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class WebSocketTestDto {
  @ApiProperty({ required: false, description: 'Mensaje personalizado para la prueba' })
  @IsOptional()
  @IsString()
  message?: string;
}