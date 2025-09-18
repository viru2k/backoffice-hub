import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsEnum, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { EntityType } from '../entities/file-upload.entity';

export class UpdateFileEntityDto {
  @ApiProperty({
    description: 'Tipo de entidad al que pertenece el archivo',
    enum: ['user', 'client', 'product', 'appointment', 'general'],
  })
  @IsEnum(['user', 'client', 'product', 'appointment', 'general'])
  @IsOptional()
  entityType?: EntityType;

  @ApiProperty({
    description: 'ID de la entidad al que pertenece el archivo',
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  entityId?: number;

  @ApiProperty({
    description: 'Descripción del archivo',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}