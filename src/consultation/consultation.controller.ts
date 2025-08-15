import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { ConsultationService } from './consultation.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';
import { ConsultationResponseDto } from './dto/consultation-response.dto';
import { UploadService } from '../upload/upload.service';

@ApiTags('consultations')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('consultations')
export class ConsultationController {
  constructor(
    private readonly consultationService: ConsultationService,
    private readonly uploadService: UploadService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear nueva consulta' })
  @ApiResponse({ status: 201, type: ConsultationResponseDto })
  create(@Body() createDto: CreateConsultationDto, @Request() req) {
    return this.consultationService.create(createDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar consultas del usuario' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Elementos por página' })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por estado' })
  @ApiQuery({ name: 'clientId', required: false, description: 'Filtrar por cliente' })
  @ApiResponse({ status: 200, type: [ConsultationResponseDto] })
  findAll(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.consultationService.findAll(
      req.user.id,
      parseInt(page),
      parseInt(limit),
      status,
      clientId ? parseInt(clientId) : undefined,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas de consultas' })
  @ApiResponse({ status: 200 })
  getStats(@Request() req) {
    return this.consultationService.getStats(req.user.id);
  }

  @Get('today')
  @ApiOperation({ summary: 'Obtener consultas de hoy' })
  @ApiResponse({ status: 200, type: [ConsultationResponseDto] })
  getTodayConsultations(@Request() req) {
    return this.consultationService.getTodayConsultations(req.user.id);
  }

  @Get('client/:clientId')
  @ApiOperation({ summary: 'Obtener historial de consultas de un cliente' })
  @ApiResponse({ status: 200, type: [ConsultationResponseDto] })
  getClientHistory(
    @Param('clientId', ParseIntPipe) clientId: number,
    @Request() req,
  ) {
    return this.consultationService.getClientHistory(clientId, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener consulta por ID' })
  @ApiResponse({ status: 200, type: ConsultationResponseDto })
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.consultationService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar consulta' })
  @ApiResponse({ status: 200, type: ConsultationResponseDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateConsultationDto,
    @Request() req,
  ) {
    return this.consultationService.update(id, updateDto, req.user.id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Actualizar estado de consulta' })
  @ApiResponse({ status: 200, type: ConsultationResponseDto })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: string },
    @Request() req,
  ) {
    return this.consultationService.updateStatus(id, body.status, req.user.id);
  }

  @Post(':id/files')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir archivo a consulta' })
  @ApiResponse({ status: 201 })
  async uploadFile(
    @Param('id', ParseIntPipe) consultationId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { description?: string },
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No se proporcionó archivo');
    }

    // Subir archivo usando el servicio de upload
    const uploadResult = await this.uploadService.uploadFile(
      file,
      {
        fileType: file.mimetype.startsWith('image/') ? 'image' : 'document',
        entityType: 'consultation',
        entityId: consultationId,
        description: body.description,
      },
      req.user,
    );

    return {
      message: 'Archivo subido exitosamente',
      file: uploadResult,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar consulta' })
  @ApiResponse({ status: 204 })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.consultationService.delete(id, req.user.id);
  }
}