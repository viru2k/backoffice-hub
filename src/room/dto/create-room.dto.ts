import { IsString, IsOptional, IsBoolean, IsNumber, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoomDto {
  @ApiProperty({ example: 'Sala de Consulta 1', description: 'Room name' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'Sala principal para consultas', required: false, description: 'Room description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ example: 4, required: false, description: 'Room capacity' })
  @IsOptional()
  @IsNumber()
  capacity?: number;

  @ApiProperty({ example: 'Planta baja', required: false, description: 'Room location' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @ApiProperty({ example: true, required: false, default: true, description: 'Room active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}