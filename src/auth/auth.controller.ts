import { Controller, Post, Body, UseGuards, Request, Get} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginDto } from './dto/login.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { User } from '../user/entities/user.entity';




@ApiTags('auth')  
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {} 

  @ApiOperation({ summary: 'Registro de usuario principal con suscripción' })
  @ApiResponse({ status: 201, description: 'Usuario registrado y token generado.'})
  @Post('register')
  register(@Body() dto: RegisterUserDto) {
    return this.authService.register(dto);
  }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  @ApiOperation({ summary: 'Login de usuario, devuelve JWT' })
  @ApiBody({ type: LoginDto }) 
  @ApiResponse({ status: 200, description: 'Login exitoso, token devuelto.'})
  @ApiResponse({ status: 401, description: 'Credenciales inválidas o cuenta inactiva.'})
  async login(@Request() req) {
    return this.authService.login(req.user);
  }


  @ApiOperation({ summary: 'Obtener datos del usuario autenticado' })
  @ApiBearerAuth() 
  @UseGuards(AuthGuard('jwt')) 
   @ApiResponse({ status: 200, description: 'Perfil del usuario autenticado.', type: ProfileResponseDto })
  @Get('profile')
 getProfile(@Request() req): ProfileResponseDto {
    return mapUserToProfileDto(req.user);
  }
}

function mapUserToProfileDto(user: User): ProfileResponseDto {
  if (!user) return null;

  // Flatten all permission names into a Set for efficient lookup.
  const userPermissions = new Set(
    user.roles.flatMap(role => role.permissions?.map(p => p.name) || [])
  );

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    lastName: user.lastName,
    isActive: user.isActive,
    roles: user.roles,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),

    // Compute the boolean flags based on the user's effective permissions.
    canManageAgenda: userPermissions.has('agenda:write:group') || userPermissions.has('agenda:write:own'),
    canManageClients: userPermissions.has('client:manage:group'),
    canManageProducts: userPermissions.has('product:manage:group'),
    canManageUsers: userPermissions.has('user:manage:group'),
  };
}