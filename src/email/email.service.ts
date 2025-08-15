import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

export interface PasswordResetEmailData {
  email: string;
  firstName: string;
  resetToken: string;
  resetLink: string;
}

export interface AccountLockoutEmailData {
  email: string;
  firstName: string;
  lockoutTime: string;
  unlockTime: string;
  failedAttempts: number;
}

export interface WelcomeEmailData {
  email: string;
  firstName: string;
  loginLink: string;
  temporaryPassword?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly mailerService: MailerService) {}

  /**
   * Envía un email de recuperación de contraseña
   */
  async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        to: data.email,
        subject: 'Recuperación de Contraseña - Orbyt',
        template: 'password-reset',
        context: {
          firstName: data.firstName,
          resetLink: data.resetLink,
          resetToken: data.resetToken,
          // El link expirará en 1 hora
          expirationTime: '1 hora',
        },
      });

      this.logger.log(`Password reset email sent to ${data.email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${data.email}`, error);
      return false;
    }
  }

  /**
   * Envía un email de notificación de bloqueo de cuenta
   */
  async sendAccountLockoutEmail(data: AccountLockoutEmailData): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        to: data.email,
        subject: 'Cuenta Bloqueada - Orbyt',
        template: 'account-lockout',
        context: {
          firstName: data.firstName,
          lockoutTime: data.lockoutTime,
          unlockTime: data.unlockTime,
          failedAttempts: data.failedAttempts,
          supportEmail: process.env.SUPPORT_EMAIL || 'soporte@orbyt.com',
        },
      });

      this.logger.log(`Account lockout email sent to ${data.email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send account lockout email to ${data.email}`, error);
      return false;
    }
  }

  /**
   * Envía un email de bienvenida con credenciales temporales
   */
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        to: data.email,
        subject: 'Bienvenido a Orbyt - Credenciales de Acceso',
        template: 'welcome',
        context: {
          firstName: data.firstName,
          loginLink: data.loginLink,
          temporaryPassword: data.temporaryPassword,
          email: data.email,
        },
      });

      this.logger.log(`Welcome email sent to ${data.email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${data.email}`, error);
      return false;
    }
  }

  /**
   * Envía un email de notificación de cambio de contraseña exitoso
   */
  async sendPasswordChangeConfirmation(email: string, firstName: string): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Contraseña Cambiada Exitosamente - Orbyt',
        template: 'password-changed',
        context: {
          firstName,
          changeTime: new Date().toLocaleString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          supportEmail: process.env.SUPPORT_EMAIL || 'soporte@orbyt.com',
        },
      });

      this.logger.log(`Password change confirmation email sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send password change confirmation to ${email}`, error);
      return false;
    }
  }

  /**
   * Envía un email de alerta de seguridad por intentos fallidos
   */
  async sendSecurityAlertEmail(
    email: string, 
    firstName: string, 
    failedAttempts: number,
    lastAttemptTime: string,
    ipAddress?: string
  ): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Alerta de Seguridad - Intentos de Acceso Fallidos',
        template: 'security-alert',
        context: {
          firstName,
          failedAttempts,
          lastAttemptTime,
          ipAddress: ipAddress || 'Dirección IP no disponible',
          supportEmail: process.env.SUPPORT_EMAIL || 'soporte@orbyt.com',
        },
      });

      this.logger.log(`Security alert email sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send security alert email to ${email}`, error);
      return false;
    }
  }

  /**
   * Prueba la configuración del servicio de email enviando un email de prueba
   */
  async sendTestEmail(to: string): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        to,
        subject: 'Email de Prueba - Orbyt',
        html: `
          <h2>Email de Prueba</h2>
          <p>Este es un email de prueba para verificar que el servicio de correo está funcionando correctamente.</p>
          <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
          <p><strong>Servicio:</strong> Orbyt Email Service</p>
        `,
      });

      this.logger.log(`Test email sent successfully to ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send test email to ${to}`, error);
      return false;
    }
  }
}