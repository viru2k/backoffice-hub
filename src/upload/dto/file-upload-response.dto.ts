import { ApiProperty } from '@nestjs/swagger';
import { EntityType, FileType } from '../entities/file-upload.entity';

export class FileUploadResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  filename: string;

  @ApiProperty()
  originalName: string;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  size: number;

  @ApiProperty()
  path: string;

  @ApiProperty({ required: false })
  thumbnailPath?: string;

  @ApiProperty({ enum: FileType })
  fileType: FileType;

  @ApiProperty({ enum: EntityType })
  entityType: EntityType;

  @ApiProperty({ required: false })
  entityId?: number;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  uploadedBy: {
    id: number;
    name: string;
  };

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiProperty({ description: 'URL completa para acceder al archivo' })
  url: string;

  @ApiProperty({ description: 'URL completa para acceder al thumbnail', required: false })
  thumbnailUrl?: string;
}