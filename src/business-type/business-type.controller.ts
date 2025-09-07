import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { BusinessTypeService } from './business-type.service';
import { CreateBusinessTypeDto, UpdateBusinessTypeDto } from './dto/create-business-type.dto';
import { CreateConsultationTypeDto, UpdateConsultationTypeDto } from './dto/create-consultation-type.dto';
import { BusinessTypeResponseDto } from './dto/business-type-response.dto';
import { ConsultationTypeResponseDto } from './dto/consultation-type-response.dto';

@ApiTags('business-types')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('business-types')
export class BusinessTypeController {
  constructor(private readonly businessTypeService: BusinessTypeService) {}

  // BUSINESS TYPES ENDPOINTS

  @Post()
  @ApiOperation({ summary: 'Crear nuevo tipo de negocio' })
  @ApiResponse({ status: 201, type: BusinessTypeResponseDto })
  createBusinessType(@Body() createDto: CreateBusinessTypeDto): Promise<BusinessTypeResponseDto> {
    return this.businessTypeService.createBusinessType(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los tipos de negocio' })
  @ApiResponse({ status: 200, type: [BusinessTypeResponseDto] })
  findAllBusinessTypes(): Promise<BusinessTypeResponseDto[]> {
    return this.businessTypeService.findAllBusinessTypes();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener tipo de negocio por ID' })
  @ApiParam({ name: 'id', description: 'ID del tipo de negocio' })
  @ApiResponse({ status: 200, type: BusinessTypeResponseDto })
  findBusinessTypeById(@Param('id', ParseIntPipe) id: number): Promise<BusinessTypeResponseDto> {
    return this.businessTypeService.findBusinessTypeById(id);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Obtener tipo de negocio por código' })
  @ApiParam({ name: 'code', description: 'Código del tipo de negocio' })
  @ApiResponse({ status: 200, type: BusinessTypeResponseDto })
  findBusinessTypeByCode(@Param('code') code: string): Promise<BusinessTypeResponseDto> {
    return this.businessTypeService.findBusinessTypeByCode(code);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar tipo de negocio' })
  @ApiParam({ name: 'id', description: 'ID del tipo de negocio' })
  @ApiResponse({ status: 200, type: BusinessTypeResponseDto })
  updateBusinessType(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateBusinessTypeDto
  ): Promise<BusinessTypeResponseDto> {
    return this.businessTypeService.updateBusinessType(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desactivar tipo de negocio' })
  @ApiParam({ name: 'id', description: 'ID del tipo de negocio' })
  @ApiResponse({ status: 204, description: 'Tipo de negocio desactivado exitosamente' })
  deleteBusinessType(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.businessTypeService.deleteBusinessType(id);
  }

  // CONSULTATION TYPES ENDPOINTS

  @Post('consultation-types')
  @ApiOperation({ summary: 'Crear nuevo tipo de consulta' })
  @ApiResponse({ status: 201, type: ConsultationTypeResponseDto })
  createConsultationType(@Body() createDto: CreateConsultationTypeDto): Promise<ConsultationTypeResponseDto> {
    return this.businessTypeService.createConsultationType(createDto);
  }

  @Get(':businessTypeId/consultation-types')
  @ApiOperation({ summary: 'Obtener tipos de consulta por tipo de negocio' })
  @ApiParam({ name: 'businessTypeId', description: 'ID del tipo de negocio' })
  @ApiResponse({ status: 200, type: [ConsultationTypeResponseDto] })
  findConsultationTypesByBusinessType(
    @Param('businessTypeId', ParseIntPipe) businessTypeId: number
  ): Promise<ConsultationTypeResponseDto[]> {
    return this.businessTypeService.findConsultationTypesByBusinessType(businessTypeId);
  }

  @Get('consultation-types/:id')
  @ApiOperation({ summary: 'Obtener tipo de consulta por ID' })
  @ApiParam({ name: 'id', description: 'ID del tipo de consulta' })
  @ApiResponse({ status: 200, type: ConsultationTypeResponseDto })
  findConsultationTypeById(@Param('id', ParseIntPipe) id: number): Promise<ConsultationTypeResponseDto> {
    return this.businessTypeService.findConsultationTypeById(id);
  }

  @Patch('consultation-types/:id')
  @ApiOperation({ summary: 'Actualizar tipo de consulta' })
  @ApiParam({ name: 'id', description: 'ID del tipo de consulta' })
  @ApiResponse({ status: 200, type: ConsultationTypeResponseDto })
  updateConsultationType(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateConsultationTypeDto
  ): Promise<ConsultationTypeResponseDto> {
    return this.businessTypeService.updateConsultationType(id, updateDto);
  }

  @Delete('consultation-types/:id')
  @ApiOperation({ summary: 'Desactivar tipo de consulta' })
  @ApiParam({ name: 'id', description: 'ID del tipo de consulta' })
  @ApiResponse({ status: 204, description: 'Tipo de consulta desactivado exitosamente' })
  deleteConsultationType(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.businessTypeService.deleteConsultationType(id);
  }

  // TEMPLATE ENDPOINTS

  @Get('code/:code/consultation-template')
  @ApiOperation({ summary: 'Obtener template de consulta por tipo de negocio' })
  @ApiParam({ name: 'code', description: 'Código del tipo de negocio (veterinary, psychology, beauty, hair_salon, medical)' })
  @ApiResponse({ status: 200, description: 'Template de formulario de consulta específico' })
  getConsultationTemplate(@Param('code') code: string): Promise<any> {
    return this.businessTypeService.getConsultationTemplate(code);
  }
}