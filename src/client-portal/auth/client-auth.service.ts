import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client, ClientStatus } from '../../client/entities/client.entity';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { AutomatedNotificationService } from '../../notification/automated-notification.service';

export interface ClientLoginDto {
  email: string;
  password: string;
}

export interface ClientRegisterDto {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ClientForgotPasswordDto {
  email: string;
}

export interface ClientResetPasswordDto {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

@Injectable()
export class ClientAuthService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    private readonly jwtService: JwtService,
    private readonly automatedNotificationService: AutomatedNotificationService,
  ) {}

  async login(loginData: ClientLoginDto) {
    const client = await this.clientRepository.findOne({
      where: { email: loginData.email },
    });

    if (!client) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!client.hasPortalAccess) {
      throw new UnauthorizedException('No tiene acceso al portal de clientes. Contacte al administrador.');
    }

    if (client.status !== ClientStatus.ACTIVE) {
      throw new UnauthorizedException('Su cuenta no está activa. Contacte al administrador.');
    }

    if (!client.password) {
      throw new UnauthorizedException('Debe configurar una contraseña primero. Use "Olvide mi contraseña".');
    }

    const isPasswordValid = await bcrypt.compare(loginData.password, client.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Actualizar último login
    await this.clientRepository.update(client.id, { lastLogin: new Date() });

    // Generar token JWT con información del cliente
    const payload = {
      sub: client.id,
      email: client.email,
      clientId: client.id,
      type: 'client', // Diferenciador para saber que es un cliente, no admin
      membershipNumber: client.membershipNumber,
    };

    return {
      access_token: this.jwtService.sign(payload),
      client: {
        id: client.id,
        name: client.name,
        lastName: client.lastName,
        email: client.email,
        preferredName: client.preferredName,
        membershipNumber: client.membershipNumber,
        avatarUrl: client.avatarUrl,
      },
    };
  }

  async enablePortalAccess(clientId: number, initialPassword: string): Promise<void> {
    const client = await this.clientRepository.findOne({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }

    if (!client.email) {
      throw new BadRequestException('El cliente debe tener un email registrado');
    }

    const hashedPassword = await bcrypt.hash(initialPassword, 10);
    
    await this.clientRepository.update(clientId, {
      hasPortalAccess: true,
      password: hashedPassword,
    });

    // Enviar email de bienvenida al portal
    try {
      await this.automatedNotificationService.sendWelcomeEmail(clientId);
    } catch (error) {
      console.warn('Error enviando email de bienvenida:', error.message);
    }
  }

  async requestPasswordReset(forgotData: ClientForgotPasswordDto): Promise<void> {
    const client = await this.clientRepository.findOne({
      where: { email: forgotData.email },
    });

    if (!client) {
      // Por seguridad, no revelamos si el email existe o no
      return;
    }

    if (!client.hasPortalAccess) {
      throw new BadRequestException('No tiene acceso al portal de clientes');
    }

    // Generar token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // 1 hora de expiración

    await this.clientRepository.update(client.id, {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    });

    // Enviar email con token de reset
    try {
      await this.automatedNotificationService.sendPasswordResetEmail(client.id, resetToken);
    } catch (error) {
      console.error('Error enviando email de reset:', error.message);
      throw new BadRequestException('Error enviando email de reset');
    }
  }

  async resetPassword(resetData: ClientResetPasswordDto): Promise<void> {
    if (resetData.newPassword !== resetData.confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    const client = await this.clientRepository.findOne({
      where: { passwordResetToken: resetData.token },
    });

    if (!client) {
      throw new BadRequestException('Token de reset inválido');
    }

    if (!client.passwordResetExpires || client.passwordResetExpires < new Date()) {
      throw new BadRequestException('Token de reset expirado');
    }

    const hashedPassword = await bcrypt.hash(resetData.newPassword, 10);

    await this.clientRepository.update(client.id, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    });
  }

  async validateClientToken(payload: any): Promise<any> {
    if (payload.type !== 'client') {
      throw new UnauthorizedException('Token inválido para cliente');
    }

    const client = await this.clientRepository.findOne({
      where: { id: payload.clientId },
    });

    if (!client) {
      throw new UnauthorizedException('Cliente no encontrado');
    }

    if (!client.hasPortalAccess || client.status !== ClientStatus.ACTIVE) {
      throw new UnauthorizedException('Acceso denegado');
    }

    return { clientId: client.id, email: client.email, type: 'client' };
  }
}