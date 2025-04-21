import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
//import { LocalAuthGuard } from './local-auth.guard';

import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RegisterUserDto } from 'src/user/dto/register-subuser.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {} 

  @ApiOperation({ summary: 'Registro de usuario principal con suscripción' })
  @Post('register')
  async register(@Body() dto: RegisterUserDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Login de usuario, devuelve JWT' })
  @Post('login')
  async login(@Body() body: { email: string, password: string }) {
    const user = await this.authService.validateUser(body.email, body.password);
    return this.authService.login(user);
  }

  @ApiOperation({ summary: 'Obtener datos del usuario autenticado' })
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getProfile(@Request() req) {
    return req.user;
  }
}

