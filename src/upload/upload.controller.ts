import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Body,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Request,
  Res,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { UploadService } from './upload.service';
import { UploadFileDto } from './dto/upload-file.dto';
import { FileUploadResponseDto } from './dto/file-upload-response.dto';
import { EntityType } from './entities/file-upload.entity';

@ApiTags('upload')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir archivo' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        fileType: {
          type: 'string',
          enum: ['image', 'document', 'avatar', 'thumbnail'],
        },
        entityType: {
          type: 'string',
          enum: ['user', 'client', 'product', 'appointment', 'general'],
        },
        entityId: {
          type: 'number',
        },
        description: {
          type: 'string',
        },
      },
    },
  })
  @ApiResponse({ status: 201, type: FileUploadResponseDto })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadFileDto,
    @Request() req,
  ): Promise<FileUploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No se proporcionó archivo');
    }

    return this.uploadService.uploadFile(file, uploadDto, req.user);
  }

  @Get('entity/:entityType/:entityId')
  @ApiOperation({ summary: 'Obtener archivos por entidad' })
  @ApiResponse({ status: 200, type: [FileUploadResponseDto] })
  async getFilesByEntity(
    @Param('entityType') entityType: EntityType,
    @Param('entityId', ParseIntPipe) entityId: number,
  ): Promise<FileUploadResponseDto[]> {
    return this.uploadService.findByEntity(entityType, entityId);
  }

  @Get('my-files')
  @ApiOperation({ summary: 'Obtener mis archivos subidos' })
  @ApiResponse({ status: 200, type: [FileUploadResponseDto] })
  async getMyFiles(@Request() req): Promise<FileUploadResponseDto[]> {
    return this.uploadService.findByUser(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Descargar archivo por ID' })
  async downloadFile(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ): Promise<void> {
    const { stream, file } = await this.uploadService.getFileStream(id);
    
    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `inline; filename="${file.originalName}"`,
      'Content-Length': file.size.toString(),
    });

    res.send(stream);
  }

  @Get(':id/thumbnail')
  @ApiOperation({ summary: 'Obtener thumbnail de imagen' })
  async getThumbnail(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ): Promise<void> {
    const { stream, file } = await this.uploadService.getFileStream(id);
    
    if (!file.thumbnailPath) {
      throw new BadRequestException('Este archivo no tiene thumbnail');
    }

    // Para thumbnails, servir el archivo de thumbnail
    const fs = require('fs/promises');
    const path = require('path');
    const thumbnailPath = path.join('./uploads', file.thumbnailPath);
    
    try {
      const thumbnailBuffer = await fs.readFile(thumbnailPath);
      res.set({
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `inline; filename="thumb_${file.originalName}"`,
      });
      res.send(thumbnailBuffer);
    } catch (error) {
      throw new BadRequestException('Thumbnail no encontrado');
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar archivo' })
  @ApiResponse({ status: 204, description: 'Archivo eliminado exitosamente' })
  async deleteFile(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<void> {
    await this.uploadService.deleteFile(id, req.user);
  }
}