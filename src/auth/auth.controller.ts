import { Controller, Post, Body, UseGuards, Request, Get} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginDto } from './dto/login.dto';

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

  // --- LOGIN ENDPOINT CORREGIDO ---
  @UseGuards(AuthGuard('local')) // 1. Usar el AuthGuard('local') para activar la estrategia
  @Post('login')
  @ApiOperation({ summary: 'Login de usuario, devuelve JWT' })
  @ApiResponse({ status: 200, description: 'Login exitoso, token devuelto.'})
  @ApiResponse({ status: 401, description: 'Credenciales inválidas o cuenta inactiva.'})
  async login(@Request() req) {
    // 2. Si el guardián pasa, req.user contiene el usuario validado
    // 3. El body del DTO se usa implícitamente por la estrategia, no necesitamos leerlo aquí.
    return this.authService.login(req.user); // 4. Llamar a login con el objeto user
  }

  @ApiOperation({ summary: 'Obtener datos del usuario autenticado' })
  @ApiBearerAuth() // Indicar que este endpoint requiere un token Bearer
  @UseGuards(AuthGuard('jwt')) // Proteger la ruta con la estrategia JWT
  @Get('profile') // Cambiado de 'me' a 'profile' para más claridad
  getProfile(@Request() req) {
    // req.user fue añadido por JwtStrategy
    return req.user;
  }
}