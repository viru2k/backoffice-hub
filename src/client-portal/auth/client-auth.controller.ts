import { Controller, Post, Body, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ClientAuthService } from './client-auth.service';

class ClientLoginDto {
  email: string;
  password: string;
}

class ClientForgotPasswordDto {
  email: string;
}

class ClientResetPasswordDto {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

@ApiTags('Client Authentication')
@Controller('client/auth')
export class ClientAuthController {
  constructor(
    private readonly clientAuthService: ClientAuthService,
  ) {}

  @Post('login')
  @ApiOperation({ 
    summary: 'Login del cliente al portal',
    description: 'Autentica un cliente en el portal usando email y contraseña. Solo clientes con acceso habilitado pueden ingresar.'
  })
  @ApiBody({ type: ClientLoginDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login exitoso',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string' },
        client: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string' },
            preferredName: { type: 'string' },
            membershipNumber: { type: 'string' },
            avatarUrl: { type: 'string' },
          }
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Credenciales inválidas o sin acceso al portal',
  })
  async login(@Body() loginData: ClientLoginDto) {
    return this.clientAuthService.login(loginData);
  }

  @Post('forgot-password')
  @ApiOperation({ 
    summary: 'Solicitar reset de contraseña',
    description: 'Envía un email con un token para resetear la contraseña del cliente. Solo funciona si el cliente tiene acceso al portal habilitado.'
  })
  @ApiBody({ type: ClientForgotPasswordDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email de reset enviado (si el email existe)',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Si el email existe, recibirá las instrucciones para resetear su contraseña' }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'No tiene acceso al portal de clientes',
  })
  async forgotPassword(@Body() forgotData: ClientForgotPasswordDto) {
    await this.clientAuthService.requestPasswordReset(forgotData);
    
    return { 
      message: 'Si el email existe, recibirá las instrucciones para resetear su contraseña' 
    };
  }

  @Post('reset-password')
  @ApiOperation({ 
    summary: 'Resetear contraseña',
    description: 'Confirma el reset de contraseña usando el token enviado por email.'
  })
  @ApiBody({ type: ClientResetPasswordDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Contraseña reseteada exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Contraseña reseteada exitosamente' }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Token inválido, expirado o contraseñas no coinciden',
  })
  async resetPassword(@Body() resetData: ClientResetPasswordDto) {
    await this.clientAuthService.resetPassword(resetData);
    
    return { message: 'Contraseña reseteada exitosamente' };
  }
}