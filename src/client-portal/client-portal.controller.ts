import { Controller, Get, Put, Body, UseGuards, Request, HttpStatus, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ClientPortalService } from './client-portal.service';
import { ClientProfileUpdateDto, ClientPasswordUpdateDto } from './dto/client-profile-update.dto';
import { ClientProfileResponseDto } from './dto/client-profile-response.dto';
import { ClientAppointmentsListDto } from './dto/client-appointments-response.dto';
import { ClientRewardsSummaryDto } from './dto/client-rewards-response.dto';
import { ClientCompleteHistoryDto } from './dto/client-history-response.dto';

@ApiTags('Client Portal')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('client/profile')
export class ClientPortalController {
  constructor(
    private readonly clientPortalService: ClientPortalService,
  ) {}

  @Get()
  @ApiOperation({ 
    summary: 'Obtener perfil del cliente',
    description: 'El cliente puede ver su perfil completo, incluyendo datos registrados por el admin (solo lectura) y sus datos personales editables'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Perfil del cliente obtenido exitosamente',
    type: ClientProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cliente no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No tiene acceso al portal de clientes',
  })
  async getProfile(@Request() req): Promise<ClientProfileResponseDto> {
    // El clientId viene del token JWT del usuario autenticado
    const clientId = req.user.clientId; // Esto se configurará en el JWT strategy
    
    return this.clientPortalService.getClientProfile(clientId);
  }

  @Put()
  @ApiOperation({ 
    summary: 'Actualizar perfil del cliente',
    description: 'El cliente puede actualizar SOLO sus campos editables: preferredName, address, gender, birthDate, personalNotes, avatarUrl. Los datos críticos (name, lastName, email, phone, membershipNumber) son de SOLO LECTURA.'
  })
  @ApiBody({ type: ClientProfileUpdateDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Perfil actualizado exitosamente',
    type: ClientProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Intento de modificar campos protegidos o sin acceso al portal',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cliente no encontrado',
  })
  async updateProfile(
    @Request() req,
    @Body() updateData: ClientProfileUpdateDto,
  ): Promise<ClientProfileResponseDto> {
    const clientId = req.user.clientId;
    
    return this.clientPortalService.updateClientProfile(clientId, updateData);
  }

  @Put('password')
  @ApiOperation({ 
    summary: 'Cambiar contraseña del portal',
    description: 'Permite al cliente cambiar su contraseña de acceso al portal. Requiere la contraseña actual para confirmar la identidad.'
  })
  @ApiBody({ type: ClientPasswordUpdateDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Contraseña actualizada exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Contraseña actualizada exitosamente' }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Contraseña actual incorrecta o datos inválidos',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No tiene acceso al portal de clientes',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cliente no encontrado',
  })
  async updatePassword(
    @Request() req,
    @Body() passwordData: ClientPasswordUpdateDto,
  ): Promise<{ message: string }> {
    const clientId = req.user.clientId;
    
    await this.clientPortalService.updatePassword(clientId, passwordData);
    
    return { message: 'Contraseña actualizada exitosamente' };
  }

  // === ENDPOINTS DE CONSULTA (SOLO LECTURA) ===

  @Get('appointments')
  @ApiOperation({ 
    summary: 'Obtener citas del cliente',
    description: 'Lista todas las citas del cliente (pasadas, presentes y futuras) con información básica. SOLO LECTURA - el cliente no puede modificar las citas.'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Elementos por página (default: 10)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de citas del cliente',
    type: ClientAppointmentsListDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No tiene acceso al portal de clientes',
  })
  async getAppointments(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ): Promise<ClientAppointmentsListDto> {
    const clientId = req.user.clientId;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    
    return this.clientPortalService.getClientAppointments(clientId, pageNum, limitNum);
  }

  @Get('rewards')
  @ApiOperation({ 
    summary: 'Obtener recompensas del cliente',
    description: 'Muestra el resumen completo de recompensas: programas en progreso, recompensas disponibles para canjear, historial y estadísticas. SOLO LECTURA - el cliente no puede canjear desde este endpoint.'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resumen completo de recompensas del cliente',
    type: ClientRewardsSummaryDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No tiene acceso al portal de clientes',
  })
  async getRewards(@Request() req): Promise<ClientRewardsSummaryDto> {
    const clientId = req.user.clientId;
    
    return this.clientPortalService.getClientRewards(clientId);
  }

  @Get('history')
  @ApiOperation({ 
    summary: 'Obtener historial completo del cliente',
    description: 'Historial de servicios recibidos, facturas y estadísticas. SOLO LECTURA - información histórica para consulta del cliente.'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Elementos por página (default: 10)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Historial completo del cliente',
    type: ClientCompleteHistoryDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No tiene acceso al portal de clientes',
  })
  async getHistory(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ): Promise<ClientCompleteHistoryDto> {
    const clientId = req.user.clientId;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    
    return this.clientPortalService.getClientHistory(clientId, pageNum, limitNum);
  }
}