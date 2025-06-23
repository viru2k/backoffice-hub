import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';
import { CreateSubUserDto } from './dto/create-subuser.dto';

import { UserResponseDto } from './dto/user-response.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { User } from './entities/user.entity';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';


function mapUserToResponseDto(user: User): UserResponseDto {
  if (!user) return null;

const response: UserResponseDto = {
    id: user.id,
    email: user.email,
    fullName: user.fullName, 
    isAdmin: user.isAdmin,
    active: user.isActive,
    createdAt: user.createdAt.toISOString(), 
    updatedAt: user.updatedAt.toISOString(), 
  };
  return response;  
}

@ApiTags('users') // Unificada la etiqueta a 'users'
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('users') // Unificada la ruta a 'users'
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obtener el perfil del usuario autenticado' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async getMyProfile(@Request() req): Promise<UserResponseDto> {
    return mapUserToResponseDto(req.user);
  }

  @Post('sub-user')
  @ApiOperation({ summary: 'Admin: Crear un nuevo sub-usuario en el grupo' })
  @ApiResponse({ status: 201, description: 'Sub-usuario creado.', type: UserResponseDto })
  async createSubUser(
    @Request() req,
    @Body() dto: CreateSubUserDto,
  ): Promise<UserResponseDto> {
    const newUser = await this.userService.createSubUser(dto, req.user);
    return mapUserToResponseDto(newUser);
  }

  @Get('group')
  @ApiOperation({ summary: 'Admin: Listar todos los usuarios del grupo' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios.', type: [UserResponseDto] })
  async getGroupUsers(@Request() req): Promise<UserResponseDto[]> {
    const users = await this.userService.findUsersByOwner(req.user.id);
    return users.map(mapUserToResponseDto);
  }

  @Patch('sub-user/:id')
  @ApiOperation({ summary: 'Admin: Actualizar un sub-usuario (perfil, permisos, estado)' })
  @ApiResponse({ status: 200, description: 'Sub-usuario actualizado.', type: UserResponseDto })
  async updateSubUser(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminUpdateUserDto,
  ): Promise<UserResponseDto> {
    const updatedUser = await this.userService.updateByAdmin(
      id,
      req.user.id,
      dto,
    );
    return mapUserToResponseDto(updatedUser);
  }
}