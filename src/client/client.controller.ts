import {
    Body,
    Controller,
    Delete,
    ForbiddenException,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    Request,
    UseGuards,
  } from '@nestjs/common';
  import { ClientService } from './client.service';
  import { CreateClientDto } from './dto/create-client.dto';
  import { UpdateClientDto } from './dto/update-client.dto';
  import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
  import { AuthGuard } from '@nestjs/passport';
import { ClientResponseDto } from './dto/client-response.dto';
import { Client } from './entities/client.entity';
import { UserService } from 'src/user/user.service';
  
function mapClientToDto(client: Client): ClientResponseDto {
  if (!client) return null;
   return {
    id: client.id,
    fullname: client.fullname,
    name: client.name,
    lastName: client.lastName,
    email: client.email,
    phone: client.phone,
    address: client.address,
    status: client.status,
    createdAt: client.createdAt.toISOString(), 
    updatedAt: client.updatedAt.toISOString(), 
  };
}

  @ApiTags('clients')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Controller('clients')
  export class ClientController {
    constructor(private readonly clientService: ClientService,  private readonly userService: UserService) {}
  
 @Post()
  @ApiOperation({ summary: 'Crear un nuevo cliente' })
  @ApiResponse({ status: 201, type: ClientResponseDto })
  async create(@Body() createClientDto: CreateClientDto, @Request() req): Promise<ClientResponseDto> {
    const client = await this.clientService.create(createClientDto, req.user);
    return mapClientToDto(client);
  }
  
    @Get()
  @ApiOperation({ summary: 'Listar clientes (admin puede ver los de un sub-usuario)' })
  @ApiQuery({ name: 'userId', required: false, type: Number, description: 'Admin: ID del usuario cuyos clientes se quieren ver' })
  @ApiResponse({ status: 200, type: [ClientResponseDto] })
  async findAll(
    @Request() req,
    @Query('userId') userId?: string,
  ): Promise<ClientResponseDto[]> {
    const requestingUser = req.user;
    const targetUserId = userId ? parseInt(userId, 10) : requestingUser.id;

    if (targetUserId !== requestingUser.id) {
      if (!requestingUser.isAdmin) {
        throw new ForbiddenException('No tienes permisos para ver los clientes de otros usuarios.');
      }
      const isMember = await this.userService.isUserInAdminGroup(targetUserId, requestingUser.id);
      if (!isMember) {
        throw new ForbiddenException('El usuario especificado no pertenece a su grupo.');
      }
    }

    const clients = await this.clientService.findAll(requestingUser, targetUserId);
    return clients.map(mapClientToDto);
  }
  
@Get(':id')
  @ApiOperation({ summary: 'Obtener detalles de un cliente (admin puede ver los de un sub-usuario)' })
  @ApiQuery({ name: 'userId', required: false, type: Number, description: 'Admin: ID del usuario dueño del cliente' })
  @ApiResponse({ status: 200, type: ClientResponseDto })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Query('userId') userId?: string,
  ): Promise<ClientResponseDto> {
    const requestingUser = req.user;
    const targetUserId = userId ? parseInt(userId, 10) : requestingUser.id;

    if (targetUserId !== requestingUser.id) {
      if (!requestingUser.isAdmin) {
        throw new ForbiddenException('No tienes permisos para ver los clientes de otros usuarios.');
      }
      const isMember = await this.userService.isUserInAdminGroup(targetUserId, requestingUser.id);
      if (!isMember) {
        throw new ForbiddenException('El usuario especificado no pertenece a su grupo.');
      }
    }
    
    const client = await this.clientService.findOne(id, requestingUser, targetUserId);
    return mapClientToDto(client);
  }
  
 @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un cliente' })
  @ApiResponse({ status: 200, type: ClientResponseDto })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateClientDto: UpdateClientDto, @Request() req): Promise<ClientResponseDto> {
    const client = await this.clientService.update(id, updateClientDto, req.user);
    return mapClientToDto(client);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un cliente' })
  @ApiResponse({ status: 204, description: 'Cliente eliminado exitosamente.' })
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req): Promise<void> {
    await this.clientService.remove(id, req.user);
  }

  }
  