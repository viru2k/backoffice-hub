import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileUpload, FileType, EntityType } from './entities/file-upload.entity';
import { UploadFileDto } from './dto/upload-file.dto';
import { FileUploadResponseDto } from './dto/file-upload-response.dto';
import { User } from '../user/entities/user.entity';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as sharp from 'sharp';

@Injectable()
export class UploadService {
  private readonly uploadDir = './uploads';
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  private readonly allowedDocumentTypes = ['application/pdf', 'text/plain', 'application/msword'];

  constructor(
    @InjectRepository(FileUpload)
    private readonly fileUploadRepo: Repository<FileUpload>,
  ) {
    this.ensureUploadDirectories();
  }

  private async ensureUploadDirectories() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }

    const subDirs = ['images', 'thumbnails', 'documents', 'avatars'];
    for (const dir of subDirs) {
      const fullPath = path.join(this.uploadDir, dir);
      try {
        await fs.access(fullPath);
      } catch {
        await fs.mkdir(fullPath, { recursive: true });
      }
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    uploadDto: UploadFileDto,
    user: User,
  ): Promise<FileUploadResponseDto> {
    // Validaciones
    this.validateFile(file, uploadDto.fileType);

    // Generar nombre único
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2);
    const extension = path.extname(file.originalname);
    const filename = `${timestamp}_${randomString}${extension}`;

    // Determinar directorio según tipo
    const subDir = this.getSubDirectory(uploadDto.fileType);
    const relativePath = path.join(subDir, filename);
    const fullPath = path.join(this.uploadDir, relativePath);

    try {
      // Guardar archivo original
      await fs.writeFile(fullPath, file.buffer);

      let thumbnailPath: string | undefined;

      // Generar thumbnail para imágenes
      if (uploadDto.fileType === FileType.IMAGE || uploadDto.fileType === FileType.AVATAR) {
        thumbnailPath = await this.generateThumbnail(fullPath, filename);
      }

      // Guardar en base de datos
      const fileUpload = this.fileUploadRepo.create({
        filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: relativePath,
        thumbnailPath,
        fileType: uploadDto.fileType || FileType.IMAGE,
        entityType: uploadDto.entityType || EntityType.GENERAL,
        entityId: uploadDto.entityId,
        description: uploadDto.description,
        uploadedBy: user,
      });

      const savedFile = await this.fileUploadRepo.save(fileUpload);
      return this.mapToResponseDto(savedFile);

    } catch (error) {
      // Limpiar archivo si algo falla
      try {
        await fs.unlink(fullPath);
      } catch {}
      throw new BadRequestException(`Error al guardar archivo: ${error.message}`);
    }
  }

  async findByEntity(entityType: EntityType, entityId: number): Promise<FileUploadResponseDto[]> {
    const files = await this.fileUploadRepo.find({
      where: { entityType, entityId, isActive: true },
      relations: ['uploadedBy'],
      order: { createdAt: 'DESC' },
    });

    return files.map(file => this.mapToResponseDto(file));
  }

  async findByUser(userId: number): Promise<FileUploadResponseDto[]> {
    const files = await this.fileUploadRepo.find({
      where: { uploadedBy: { id: userId }, isActive: true },
      relations: ['uploadedBy'],
      order: { createdAt: 'DESC' },
    });

    return files.map(file => this.mapToResponseDto(file));
  }

  async deleteFile(id: number, user: User): Promise<void> {
    const file = await this.fileUploadRepo.findOne({
      where: { id },
      relations: ['uploadedBy'],
    });

    if (!file) {
      throw new NotFoundException('Archivo no encontrado');
    }

    // Solo el propietario o admin puede eliminar
    if (file.uploadedBy.id !== user.id && !user.isAdmin) {
      throw new BadRequestException('No tienes permisos para eliminar este archivo');
    }

    try {
      // Eliminar archivos físicos
      const fullPath = path.join(this.uploadDir, file.path);
      await fs.unlink(fullPath);

      if (file.thumbnailPath) {
        const thumbnailFullPath = path.join(this.uploadDir, file.thumbnailPath);
        await fs.unlink(thumbnailFullPath);
      }
    } catch (error) {
      console.warn('Error al eliminar archivo físico:', error.message);
    }

    // Marcar como inactivo en lugar de eliminar
    await this.fileUploadRepo.update(id, { isActive: false });
  }

  async getFileStream(id: number): Promise<{ stream: Buffer; file: FileUpload }> {
    const file = await this.fileUploadRepo.findOne({
      where: { id, isActive: true },
    });

    if (!file) {
      throw new NotFoundException('Archivo no encontrado');
    }

    const fullPath = path.join(this.uploadDir, file.path);
    
    try {
      const buffer = await fs.readFile(fullPath);
      return { stream: buffer, file };
    } catch (error) {
      throw new NotFoundException('Archivo físico no encontrado');
    }
  }

  private validateFile(file: Express.Multer.File, fileType: FileType) {
    if (!file) {
      throw new BadRequestException('No se proporcionó archivo');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException('El archivo excede el tamaño máximo permitido (10MB)');
    }

    if (fileType === FileType.IMAGE || fileType === FileType.AVATAR || fileType === FileType.THUMBNAIL) {
      if (!this.allowedImageTypes.includes(file.mimetype)) {
        throw new BadRequestException('Tipo de imagen no permitido. Use: JPEG, PNG, WebP o GIF');
      }
    }

    if (fileType === FileType.DOCUMENT) {
      if (!this.allowedDocumentTypes.includes(file.mimetype)) {
        throw new BadRequestException('Tipo de documento no permitido. Use: PDF, TXT o DOC');
      }
    }
  }

  private getSubDirectory(fileType: FileType): string {
    switch (fileType) {
      case FileType.AVATAR:
        return 'avatars';
      case FileType.THUMBNAIL:
        return 'thumbnails';
      case FileType.DOCUMENT:
        return 'documents';
      default:
        return 'images';
    }
  }

  private async generateThumbnail(originalPath: string, filename: string): Promise<string> {
    try {
      const thumbnailFilename = `thumb_${filename}`;
      const thumbnailPath = path.join('thumbnails', thumbnailFilename);
      const thumbnailFullPath = path.join(this.uploadDir, thumbnailPath);

      await sharp(originalPath)
        .resize(300, 300, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailFullPath);

      return thumbnailPath;
    } catch (error) {
      console.warn('Error generando thumbnail:', error.message);
      return undefined;
    }
  }

  private mapToResponseDto(file: FileUpload): FileUploadResponseDto {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
    
    return {
      id: file.id,
      filename: file.filename,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      path: file.path,
      thumbnailPath: file.thumbnailPath,
      fileType: file.fileType,
      entityType: file.entityType,
      entityId: file.entityId,
      description: file.description,
      isActive: file.isActive,
      uploadedBy: {
        id: file.uploadedBy.id,
        name: file.uploadedBy.name,
      },
      createdAt: file.createdAt.toISOString(),
      updatedAt: file.updatedAt.toISOString(),
      url: `${baseUrl}/api/upload/${file.id}`,
      thumbnailUrl: file.thumbnailPath ? `${baseUrl}/api/upload/${file.id}/thumbnail` : undefined,
    };
  }
}