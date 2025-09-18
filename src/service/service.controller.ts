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
  ParseIntPipe,
  HttpStatus,
  ValidationPipe,
  Request
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../user/entities/user.entity';
import { ServiceService } from './service.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceFiltersDto } from './dto/service-filters.dto';
import { ServiceResponseDto } from './dto/service-response.dto';
import { ServiceListResponseDto } from './dto/service-list-response.dto';

@ApiTags('Services')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('service')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new service' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Service created successfully', type: ServiceResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  async create(
    @Body(ValidationPipe) createServiceDto: CreateServiceDto,
    @Request() req,
  ): Promise<ServiceResponseDto> {
    return this.serviceService.create(createServiceDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all services with optional filters' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Services retrieved successfully', type: ServiceListResponseDto })
  async findAll(
    @Query(ValidationPipe) filters: ServiceFiltersDto,
    @Request() req,
  ): Promise<ServiceListResponseDto> {
    return this.serviceService.findAll(filters, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Service retrieved successfully', type: ServiceResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Service not found' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<ServiceResponseDto> {
    return this.serviceService.findOne(id, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update service by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Service updated successfully', type: ServiceResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Service not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateServiceDto: UpdateServiceDto,
    @Request() req,
  ): Promise<ServiceResponseDto> {
    return this.serviceService.update(id, updateServiceDto, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete service by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Service deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Service not found' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<{ message: string }> {
    await this.serviceService.remove(id, req.user);
    return { message: 'Service deleted successfully' };
  }

  @Get('categories/list')
  @ApiOperation({ summary: 'Get all service categories for current user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Categories retrieved successfully' })
  async getCategories(@Request() req): Promise<string[]> {
    return this.serviceService.getCategories(req.user);
  }

  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Toggle service status (ACTIVE/INACTIVE)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Service status toggled successfully', type: ServiceResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Service not found' })
  async toggleStatus(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<ServiceResponseDto> {
    return this.serviceService.toggleStatus(id, req.user);
  }
}
