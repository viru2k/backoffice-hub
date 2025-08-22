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
import { ConsultationFiltersDto } from './dto/consultation-filters.dto';
import { UploadService } from '../upload/upload.service';
import { FileType, EntityType } from '../upload/entities/file-upload.entity';
import { ConsultationTokenService } from './consultation-token.service';
import { CreateConsultationTokenDto, ConsultationTokenResponseDto } from './dto/consultation-token.dto';
import { plainToInstance } from 'class-transformer';

@ApiTags('consultations')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('consultations')
export class ConsultationController {
  constructor(
    private readonly consultationService: ConsultationService,
    private readonly uploadService: UploadService,
    private readonly consultationTokenService: ConsultationTokenService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear nueva consulta' })
  @ApiResponse({ status: 201, type: ConsultationResponseDto })
  create(@Body() createDto: CreateConsultationDto, @Request() req) {
    return this.consultationService.create(createDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar consultas del usuario con filtros avanzados' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Elementos por página' })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por estado' })
  @ApiQuery({ name: 'clientId', required: false, description: 'Filtrar por cliente' })
  @ApiQuery({ name: 'date', required: false, description: 'Filtrar por fecha específica (YYYY-MM-DD)' })
  @ApiQuery({ name: 'today', required: false, description: 'Solo consultas de hoy' })
  @ApiQuery({ name: 'fromDate', required: false, description: 'Desde fecha (YYYY-MM-DD)' })
  @ApiQuery({ name: 'toDate', required: false, description: 'Hasta fecha (YYYY-MM-DD)' })
  @ApiQuery({ name: 'consultationTypeId', required: false, description: 'Filtrar por tipo de consulta' })
  @ApiQuery({ name: 'clientName', required: false, description: 'Buscar por nombre del cliente' })
  @ApiResponse({ status: 200, type: [ConsultationResponseDto] })
  findAll(@Request() req, @Query() filters: ConsultationFiltersDto) {
    return this.consultationService.findAll(req.user.id, filters);
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
        fileType: file.mimetype.startsWith('image/') ? FileType.IMAGE : FileType.DOCUMENT,
        entityType: EntityType.CONSULTATION,
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

  // Consultation Token Endpoints
  @Post(':id/tokens')
  @ApiOperation({ summary: 'Crear token manual para consulta' })
  @ApiResponse({ status: 201, type: ConsultationTokenResponseDto })
  async createToken(
    @Param('id', ParseIntPipe) consultationId: number,
    @Body() createTokenDto: CreateConsultationTokenDto,
    @Request() req,
  ) {
    const token = await this.consultationTokenService.createTokenForConsultation(consultationId, createTokenDto);
    return plainToInstance(ConsultationTokenResponseDto, token, { excludeExtraneousValues: true });
  }

  @Post(':id/tokens/auto')
  @ApiOperation({ summary: 'Crear tokens automáticos para consulta' })
  @ApiResponse({ status: 201, type: [ConsultationTokenResponseDto] })
  async createAutoTokens(
    @Param('id', ParseIntPipe) consultationId: number,
    @Request() req,
  ) {
    const tokens = await this.consultationTokenService.createAutoTokensForConsultation(consultationId);
    return tokens.map(token => plainToInstance(ConsultationTokenResponseDto, token, { excludeExtraneousValues: true }));
  }

  @Post(':id/tokens/scenario/:scenario')
  @ApiOperation({ summary: 'Crear token por escenario específico' })
  @ApiResponse({ status: 201, type: ConsultationTokenResponseDto })
  async createTokenByScenario(
    @Param('id', ParseIntPipe) consultationId: number,
    @Param('scenario') scenario: 'post-consultation' | 'follow-up' | 'pre-appointment' | 'custom',
    @Body() customData: Partial<CreateConsultationTokenDto> = {},
    @Request() req,
  ) {
    const token = await this.consultationTokenService.createTokenByScenario(consultationId, scenario, customData);
    return plainToInstance(ConsultationTokenResponseDto, token, { excludeExtraneousValues: true });
  }

  @Get(':id/tokens')
  @ApiOperation({ summary: 'Obtener todos los tokens de una consulta' })
  @ApiResponse({ status: 200, type: [ConsultationTokenResponseDto] })
  async getTokensForConsultation(
    @Param('id', ParseIntPipe) consultationId: number,
    @Request() req,
  ) {
    const tokens = await this.consultationTokenService.getTokensForConsultation(consultationId);
    return tokens.map(token => plainToInstance(ConsultationTokenResponseDto, token, { excludeExtraneousValues: true }));
  }

  @Delete('tokens/:tokenId')
  @ApiOperation({ summary: 'Revocar token específico' })
  @ApiResponse({ status: 204 })
  async revokeToken(
    @Param('tokenId', ParseIntPipe) tokenId: number,
    @Request() req,
  ) {
    await this.consultationTokenService.revokeToken(tokenId);
    return { message: 'Token revocado exitosamente' };
  }
}