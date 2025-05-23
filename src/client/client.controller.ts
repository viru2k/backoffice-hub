import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Request,
    UseGuards,
  } from '@nestjs/common';
  import { ClientService } from './client.service';
  import { CreateClientDto } from './dto/create-client.dto';
  import { UpdateClientDto } from './dto/update-client.dto';
  import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
  import { AuthGuard } from '@nestjs/passport';
import { ClientResponseDto } from './dto/client-response.dto';
  
  @ApiTags('clients')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Controller('clients')
  export class ClientController {
    constructor(private readonly clientService: ClientService) {}
  
    @Post()
    @ApiOperation({ summary: 'Crear cliente' })
    @ApiResponse({ type: ClientResponseDto })
    create(@Body() dto: CreateClientDto, @Request() req) {
      return this.clientService.create(dto, req.user);
    }
  
    @Get()
    @ApiOperation({ summary: 'Listar clientes del usuario' })

    @ApiResponse({ type: [ClientResponseDto] })
    findAll(@Request() req) {
      return this.clientService.findAll(req.user.id);
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Obtener un cliente' })
    @ApiResponse({ type: ClientResponseDto })
    findOne(@Param('id') id: number, @Request() req) {
      return this.clientService.findOne(id, req.user.id);
    }
  
    @Patch(':id')
    @ApiOperation({ summary: 'Actualizar cliente' })
    @ApiResponse({ type: ClientResponseDto })
    update(@Param('id') id: number, @Body() dto: UpdateClientDto, @Request() req) {
      return this.clientService.update(id, dto, req.user.id);
    }
  
    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar cliente' })
    remove(@Param('id') id: number, @Request() req) {
      return this.clientService.remove(id, req.user.id);
    }
  }
  