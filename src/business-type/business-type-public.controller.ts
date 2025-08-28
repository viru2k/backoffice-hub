import {
  Controller,
  Get,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { BusinessTypeService } from './business-type.service';

@ApiTags('business-types-public')
@Controller('public/business-types')
export class BusinessTypePublicController {
  constructor(private readonly businessTypeService: BusinessTypeService) {}

  @Get('code/:code/consultation-template')
  @ApiOperation({ summary: 'Obtener template de consulta por tipo de negocio (público)' })
  @ApiParam({ name: 'code', description: 'Código del tipo de negocio (veterinary, psychology, beauty, hair_salon, medical)' })
  @ApiResponse({ status: 200, description: 'Template de formulario de consulta específico' })
  getConsultationTemplate(@Param('code') code: string): Promise<any> {
    return this.businessTypeService.getConsultationTemplate(code);
  }
}