import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as CryptoJS from 'crypto-js';
import * as nodemailer from 'nodemailer';
import { EmailSettings } from './entities/email-settings.entity';
import { EmailTemplate } from './entities/email-template.entity';
import { EmailLog, EmailStatus } from './entities/email-log.entity';
import { EmailSettingsDto, EmailSettingsResponseDto, TestConnectionResponseDto } from './dto/email-settings.dto';
import { CreateEmailTemplateDto, UpdateEmailTemplateDto, EmailTemplateResponseDto } from './dto/email-template.dto';
import { SendEmailDto, SendTemplateEmailDto, BulkEmailDto, EmailSendResponseDto, BulkEmailResponseDto } from './dto/send-email.dto';
import { plainToInstance } from 'class-transformer';

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
  private readonly encryptionKey = process.env.EMAIL_ENCRYPTION_KEY || 'default-32-char-encryption-key-123';

  constructor(
    private readonly mailerService: MailerService,
    @InjectRepository(EmailSettings)
    private readonly emailSettingsRepository: Repository<EmailSettings>,
    @InjectRepository(EmailTemplate)
    private readonly emailTemplateRepository: Repository<EmailTemplate>,
    @InjectRepository(EmailLog)
    private readonly emailLogRepository: Repository<EmailLog>,
  ) {}

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

  // === SMTP CONFIGURATION METHODS ===

  async saveEmailSettings(settings: EmailSettingsDto): Promise<void> {
    const encryptedPassword = this.encryptPassword(settings.smtpPassword);
    
    const emailSettings = this.emailSettingsRepository.create({
      ...settings,
      smtpPassword: encryptedPassword,
    });

    await this.emailSettingsRepository.save(emailSettings);
    this.logger.log('Email settings saved successfully');
  }

  async getEmailSettings(): Promise<EmailSettingsResponseDto> {
    const settings = await this.emailSettingsRepository.findOne({ 
      where: { isActive: true } 
    });
    
    if (!settings) {
      throw new NotFoundException('No email settings found');
    }

    return plainToInstance(EmailSettingsResponseDto, {
      ...settings,
      smtpPassword: '***HIDDEN***',
    });
  }

  async updateEmailSettings(id: string, settings: Partial<EmailSettingsDto>): Promise<void> {
    const existingSettings = await this.emailSettingsRepository.findOne({ where: { id } });
    
    if (!existingSettings) {
      throw new NotFoundException('Email settings not found');
    }

    const updateData = { ...settings };
    if (settings.smtpPassword) {
      updateData.smtpPassword = this.encryptPassword(settings.smtpPassword);
    }

    await this.emailSettingsRepository.update(id, updateData);
    this.logger.log('Email settings updated successfully');
  }

  async createEmailSettings(settings: EmailSettingsDto): Promise<EmailSettingsResponseDto> {
    // Deactivate any existing active settings
    await this.emailSettingsRepository.update(
      { isActive: true }, 
      { isActive: false }
    );

    const encryptedPassword = this.encryptPassword(settings.smtpPassword);
    
    const emailSettings = this.emailSettingsRepository.create({
      ...settings,
      smtpPassword: encryptedPassword,
      isActive: true,
    });

    const savedSettings = await this.emailSettingsRepository.save(emailSettings);
    this.logger.log('Email settings created successfully');

    return plainToInstance(EmailSettingsResponseDto, {
      ...savedSettings,
      smtpPassword: '***HIDDEN***',
    });
  }

  async validateSmtpSettings(settings: EmailSettingsDto): Promise<TestConnectionResponseDto> {
    try {
      const transporter = nodemailer.createTransport({
        host: settings.smtpHost,
        port: settings.smtpPort,
        secure: settings.smtpSecure,
        auth: {
          user: settings.smtpUser,
          pass: settings.smtpPassword,
        },
        connectionTimeout: settings.advancedSettings?.connectionTimeout || 10000,
        greetingTimeout: settings.advancedSettings?.greetingTimeout || 10000,
        socketTimeout: settings.advancedSettings?.socketTimeout || 10000,
      });

      await transporter.verify();
      
      return {
        success: true,
        message: 'SMTP settings are valid',
        testedAt: new Date(),
      };
    } catch (error) {
      this.logger.error('SMTP settings validation failed', error);
      return {
        success: false,
        message: 'SMTP settings validation failed',
        error: error.message,
        testedAt: new Date(),
      };
    }
  }

  async testSmtpConnection(): Promise<TestConnectionResponseDto> {
    const settings = await this.emailSettingsRepository.findOne({ 
      where: { isActive: true } 
    });
    
    if (!settings) {
      return {
        success: false,
        message: 'No email settings configured',
        testedAt: new Date(),
      };
    }

    try {
      const decryptedPassword = this.decryptPassword(settings.smtpPassword);
      
      const transporter = nodemailer.createTransport({
        host: settings.smtpHost,
        port: settings.smtpPort,
        secure: settings.smtpSecure,
        auth: {
          user: settings.smtpUser,
          pass: decryptedPassword,
        },
      });

      await transporter.verify();
      
      // Update test status
      await this.emailSettingsRepository.update(settings.id, {
        testStatus: 'success',
        lastTestedAt: new Date(),
      });

      return {
        success: true,
        message: 'SMTP connection successful',
        testedAt: new Date(),
      };
    } catch (error) {
      // Update test status
      await this.emailSettingsRepository.update(settings.id, {
        testStatus: 'failed',
        lastTestedAt: new Date(),
      });

      this.logger.error('SMTP connection test failed', error);
      return {
        success: false,
        message: 'SMTP connection failed',
        error: error.message,
        testedAt: new Date(),
      };
    }
  }

  // === TEMPLATE MANAGEMENT ===

  async createTemplate(templateDto: CreateEmailTemplateDto, createdBy: string): Promise<EmailTemplateResponseDto> {
    const template = this.emailTemplateRepository.create({
      ...templateDto,
      createdBy,
    });

    const savedTemplate = await this.emailTemplateRepository.save(template);
    return plainToInstance(EmailTemplateResponseDto, savedTemplate);
  }

  async updateTemplate(id: string, templateDto: UpdateEmailTemplateDto): Promise<EmailTemplateResponseDto> {
    const template = await this.emailTemplateRepository.findOne({ where: { id } });
    
    if (!template) {
      throw new NotFoundException('Email template not found');
    }

    await this.emailTemplateRepository.update(id, templateDto);
    const updatedTemplate = await this.emailTemplateRepository.findOne({ where: { id } });
    
    return plainToInstance(EmailTemplateResponseDto, updatedTemplate);
  }

  async deleteTemplate(id: string): Promise<void> {
    const result = await this.emailTemplateRepository.delete(id);
    
    if (result.affected === 0) {
      throw new NotFoundException('Email template not found');
    }
  }

  async getTemplates(): Promise<EmailTemplateResponseDto[]> {
    const templates = await this.emailTemplateRepository.find();
    return plainToInstance(EmailTemplateResponseDto, templates);
  }

  async getTemplateById(id: string): Promise<EmailTemplateResponseDto> {
    const template = await this.emailTemplateRepository.findOne({ where: { id } });
    
    if (!template) {
      throw new NotFoundException('Email template not found');
    }

    return plainToInstance(EmailTemplateResponseDto, template);
  }

  // === EMAIL SENDING ===

  async sendEmail(emailData: SendEmailDto): Promise<EmailSendResponseDto> {
    try {
      const result = await this.mailerService.sendMail({
        to: emailData.to,
        cc: emailData.cc,
        bcc: emailData.bcc,
        subject: emailData.subject,
        html: emailData.htmlContent,
        text: emailData.textContent,
        priority: emailData.priority as any,
      });

      // Log the email
      const log = await this.createEmailLog({
        to: emailData.to,
        cc: emailData.cc,
        bcc: emailData.bcc,
        subject: emailData.subject,
        status: EmailStatus.SENT,
        sentAt: new Date(),
        htmlContent: emailData.htmlContent,
        textContent: emailData.textContent,
        priority: emailData.priority || 'normal',
      });

      return {
        success: true,
        messageId: result.messageId,
        logId: log.id,
      };
    } catch (error) {
      this.logger.error('Failed to send email', error);
      
      // Log the failed email
      const log = await this.createEmailLog({
        to: emailData.to,
        cc: emailData.cc,
        bcc: emailData.bcc,
        subject: emailData.subject,
        status: EmailStatus.FAILED,
        failedAt: new Date(),
        errorMessage: error.message,
        htmlContent: emailData.htmlContent,
        textContent: emailData.textContent,
        priority: emailData.priority || 'normal',
      });

      return {
        success: false,
        messageId: '',
        logId: log.id,
        error: error.message,
      };
    }
  }

  async sendTemplateEmail(emailData: SendTemplateEmailDto): Promise<EmailSendResponseDto> {
    const template = await this.getTemplateById(emailData.templateId);
    
    // Process template variables
    let processedSubject = template.subject;
    let processedHtml = template.htmlContent;
    
    if (emailData.templateVariables) {
      Object.entries(emailData.templateVariables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        processedSubject = processedSubject.replace(regex, String(value));
        processedHtml = processedHtml.replace(regex, String(value));
      });
    }

    // Update template usage stats
    await this.emailTemplateRepository.update(template.id, {
      usageCount: template.usageCount + 1,
      lastUsed: new Date(),
    });

    return this.sendEmail({
      to: emailData.to,
      cc: emailData.cc,
      bcc: emailData.bcc,
      subject: processedSubject,
      htmlContent: processedHtml,
      textContent: template.textContent,
      attachments: emailData.attachments,
    });
  }

  async sendBulkEmails(bulkData: BulkEmailDto): Promise<BulkEmailResponseDto> {
    const results: EmailSendResponseDto[] = [];
    
    for (const recipient of bulkData.recipients) {
      const result = await this.sendTemplateEmail({
        templateId: bulkData.templateId,
        to: [recipient.email],
        templateVariables: {
          ...recipient.variables,
          recipientName: recipient.name || recipient.email,
        },
      });
      results.push(result);
    }

    return {
      totalRecipients: bulkData.recipients.length,
      successfulSends: results.filter(r => r.success).length,
      failedSends: results.filter(r => !r.success).length,
      logIds: results.map(r => r.logId),
      errors: results.filter(r => !r.success).map(r => r.error).filter(Boolean),
    };
  }

  // === INTEGRATION METHODS ===

  async sendWelcomeEmailByUserId(userId: string): Promise<EmailSendResponseDto> {
    // This will be implemented when integrating with User module
    throw new Error('Method not implemented - requires User module integration');
  }

  async sendPasswordResetEmailByUserId(userId: string): Promise<EmailSendResponseDto> {
    // This will be implemented when integrating with User module
    throw new Error('Method not implemented - requires User module integration');
  }

  async sendAppointmentReminderByAppointmentId(appointmentId: string): Promise<EmailSendResponseDto> {
    // This will be implemented when integrating with Agenda module
    throw new Error('Method not implemented - requires Agenda module integration');
  }

  // === UTILITY METHODS ===

  private encryptPassword(password: string): string {
    return CryptoJS.AES.encrypt(password, this.encryptionKey).toString();
  }

  private decryptPassword(encryptedPassword: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedPassword, this.encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  private async createEmailLog(logData: Partial<EmailLog>): Promise<EmailLog> {
    const log = this.emailLogRepository.create(logData);
    return await this.emailLogRepository.save(log);
  }
}