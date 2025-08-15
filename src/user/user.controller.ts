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
import { CreateSubUserDto } from './dto/create-sub-user.dto';

import { UserResponseDto } from './dto/user-response.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import { User } from './entities/user.entity';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { RoleResponseDto } from '../roles/dto/role-response.dto';
import { PermissionResponseDto } from '../permissions/dto/permission-response.dto';

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
    roles: user.roles ? user.roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions ? role.permissions.map(permission => ({
        id: permission.id,
        name: permission.name,
        description: permission.description,
      })) : [],
    })) : [],
  };
  return response;
}

@ApiTags('users') // Unificada la etiqueta a 'users'
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
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
  @Permissions('user:manage:group')
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
  @Permissions('user:manage:group') 
  @ApiOperation({ summary: 'Admin: Listar todos los usuarios del grupo incluyendo admin' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios.', type: [UserResponseDto] })
  async getGroupUsers(@Request() req): Promise<UserResponseDto[]> {
    const users = await this.userService.findAllUsersInGroup(req.user.id);
    return users.map(mapUserToResponseDto);
  }

  @Get('sub-users')
  @Permissions('user:manage:group') 
  @ApiOperation({ summary: 'Admin: Listar solo los sub-usuarios del grupo' })
  @ApiResponse({ status: 200, description: 'Lista de sub-usuarios.', type: [UserResponseDto] })
  async getSubUsers(@Request() req): Promise<UserResponseDto[]> {
    const users = await this.userService.findUsersByOwner(req.user.id);
    return users.map(mapUserToResponseDto);
  }

  @Patch('sub-user/:id')
  @Permissions('user:manage:group')
  @ApiOperation({ summary: 'Admin: Actualizar un sub-usuario (perfil, permisos, estado)' })
  @ApiBody({
    type: AdminUpdateUserDto,
    examples: {
      'actualizar_roles_y_estado': {
        summary: 'Actualizar roles y estado de actividad',
        value: {
          isActive: true,
          roles: [{ id: 1, name: 'Admin de Cuenta' }, { id: 2, name: 'Profesional' }]
        },
      },
      'actualizar_solo_nombre': {
        summary: 'Actualizar solo el nombre completo',
        value: {
          fullName: 'Nuevo Nombre Completo'
        },
      },
    },
  })
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