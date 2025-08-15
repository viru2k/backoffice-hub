import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsInt, IsString } from 'class-validator';
import { EntityType, FileType } from '../entities/file-upload.entity';

export class UploadFileDto {
  @ApiProperty({ 
    enum: FileType, 
    description: 'Tipo de archivo',
    default: FileType.IMAGE 
  })
  @IsEnum(FileType)
  @IsOptional()
  fileType?: FileType = FileType.IMAGE;

  @ApiProperty({ 
    enum: EntityType, 
    description: 'Tipo de entidad al que pertenece el archivo',
    default: EntityType.GENERAL 
  })
  @IsEnum(EntityType)
  @IsOptional()
  entityType?: EntityType = EntityType.GENERAL;

  @ApiProperty({ 
    description: 'ID de la entidad al que pertenece el archivo',
    required: false 
  })
  @IsInt()
  @IsOptional()
  entityId?: number;

  @ApiProperty({ 
    description: 'Descripción del archivo',
    required: false 
  })
  @IsString()
  @IsOptional()
  description?: string;
}