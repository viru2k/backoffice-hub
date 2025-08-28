import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailTemplate, EmailTemplateType } from '../email/entities/email-template.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmailTemplatesSeedService {
  private readonly logger = new Logger(EmailTemplatesSeedService.name);

  constructor(
    @InjectRepository(EmailTemplate)
    private emailTemplateRepository: Repository<EmailTemplate>,
  ) {}

  async seed() {
    this.logger.log('🌱 Starting Email Templates seeding...');

    const templates = [
      {
        name: 'Bienvenida de Usuario',
        subject: 'Bienvenido a Orbyt - Credenciales de Acceso',
        type: EmailTemplateType.WELCOME,
        description: 'Email enviado automáticamente cuando se registra un nuevo usuario',
        variables: ['firstName', 'loginLink', 'temporaryPassword', 'email'],
        isActive: true,
        templateFile: 'welcome.hbs',
      },
      {
        name: 'Recuperación de Contraseña',
        subject: 'Recuperación de Contraseña - Orbyt',
        type: EmailTemplateType.PASSWORD_RESET,
        description: 'Email para recuperación de contraseña con token de reset',
        variables: ['firstName', 'resetLink', 'resetToken', 'expirationTime'],
        isActive: true,
        templateFile: 'password-reset.hbs',
      },
      {
        name: 'Confirmación de Cita',
        subject: 'Confirmación de Cita - Orbyt',
        type: EmailTemplateType.APPOINTMENT_CONFIRMATION,
        description: 'Email de confirmación cuando se crea una nueva cita',
        variables: ['clientName', 'appointmentDate', 'appointmentTime', 'serviceName', 'professionalName', 'location', 'notes', 'supportEmail'],
        isActive: true,
        templateFile: 'appointment-confirmation.hbs',
      },
      {
        name: 'Recordatorio de Cita',
        subject: '🔔 Recordatorio de Cita - Orbyt',
        type: EmailTemplateType.APPOINTMENT_REMINDER,
        description: 'Email de recordatorio enviado antes de las citas programadas',
        variables: ['clientName', 'appointmentDate', 'appointmentTime', 'serviceName', 'professionalName', 'location', 'timeUntil', 'confirmationUrl', 'rescheduleUrl', 'supportPhone', 'supportEmail'],
        isActive: true,
        templateFile: 'appointment-reminder.hbs',
      },
      {
        name: 'Recompensa Ganada',
        subject: '🎉 ¡Felicitaciones! Has ganado una recompensa - Orbyt',
        type: EmailTemplateType.REWARD_NOTIFICATION,
        description: 'Email enviado cuando un cliente gana una nueva recompensa',
        variables: ['clientName', 'programName', 'rewardType', 'rewardValue', 'isPercentage', 'isAmount', 'isFreeService', 'isPoints', 'rewardDescription', 'expirationDate', 'redeemUrl', 'otherRewards', 'supportEmail'],
        isActive: true,
        templateFile: 'reward-notification.hbs',
      },
      {
        name: 'Alerta de Seguridad',
        subject: 'Alerta de Seguridad - Intentos de Acceso Fallidos',
        type: EmailTemplateType.CUSTOM,
        description: 'Email de alerta por intentos de acceso fallidos',
        variables: ['firstName', 'failedAttempts', 'lastAttemptTime', 'ipAddress', 'supportEmail'],
        isActive: true,
        templateFile: 'security-alert.hbs',
      },
      {
        name: 'Contraseña Cambiada',
        subject: 'Contraseña Cambiada Exitosamente - Orbyt',
        type: EmailTemplateType.CUSTOM,
        description: 'Confirmación de cambio de contraseña exitoso',
        variables: ['firstName', 'changeTime', 'supportEmail'],
        isActive: true,
        templateFile: 'password-changed.hbs',
      },
      {
        name: 'Cuenta Bloqueada',
        subject: 'Cuenta Bloqueada - Orbyt',
        type: EmailTemplateType.CUSTOM,
        description: 'Notificación de bloqueo de cuenta por intentos fallidos',
        variables: ['firstName', 'lockoutTime', 'unlockTime', 'failedAttempts', 'supportEmail'],
        isActive: true,
        templateFile: 'account-lockout.hbs',
      },
    ];

    for (const templateData of templates) {
      try {
        // Check if template already exists
        const existingTemplate = await this.emailTemplateRepository.findOne({
          where: { 
            name: templateData.name,
            type: templateData.type 
          },
        });

        if (existingTemplate) {
          this.logger.log(`Template "${templateData.name}" already exists, skipping...`);
          continue;
        }

        // Read template file content
        const templatePath = path.join(__dirname, '../email/templates', templateData.templateFile);
        let htmlContent = '';
        let textContent = '';

        if (fs.existsSync(templatePath)) {
          htmlContent = fs.readFileSync(templatePath, 'utf8');
          this.logger.log(`✅ Loaded template file: ${templateData.templateFile}`);
        } else {
          this.logger.warn(`⚠️ Template file not found: ${templatePath}`);
          htmlContent = this.getDefaultHtmlTemplate(templateData.name, templateData.variables);
        }

        // Generate simple text version from variables
        textContent = this.generateTextContent(templateData.name, templateData.variables);

        // Create template
        const template = this.emailTemplateRepository.create({
          name: templateData.name,
          subject: templateData.subject,
          htmlContent,
          textContent,
          type: templateData.type,
          description: templateData.description,
          variables: templateData.variables,
          isActive: templateData.isActive,
          createdBy: 'system-seeder',
          usageCount: 0,
        });

        await this.emailTemplateRepository.save(template);
        this.logger.log(`✅ Created template: ${templateData.name}`);

      } catch (error) {
        this.logger.error(`❌ Failed to create template "${templateData.name}":`, error.message);
      }
    }

    this.logger.log('🎉 Email Templates seeding completed!');
  }

  private getDefaultHtmlTemplate(name: string, variables: string[]): string {
    const variablesList = variables.map(v => `<li><strong>{{${v}}}</strong></li>`).join('');
    
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${name} - Orbyt</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { color: #007bff; font-size: 24px; font-weight: bold; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Orbyt</div>
            <h1 style="color: #333; margin: 20px 0;">${name}</h1>
        </div>
        
        <p>Esta es una plantilla por defecto para <strong>${name}</strong>.</p>
        
        <h3>Variables disponibles:</h3>
        <ul>
            ${variablesList}
        </ul>
        
        <p>Por favor, personalice esta plantilla según sus necesidades.</p>
        
        <div class="footer">
            <p>Este es un mensaje automático, por favor no responda a este email.</p>
            <p>Sistema Orbyt - Gestión Integral</p>
        </div>
    </div>
</body>
</html>`;
  }

  private generateTextContent(name: string, variables: string[]): string {
    const variablesList = variables.map(v => `- {{${v}}}`).join('\\n');
    
    return `
${name} - Orbyt

Esta es una plantilla por defecto para ${name}.

Variables disponibles:
${variablesList}

Por favor, personalice esta plantilla según sus necesidades.

---
Este es un mensaje automático, por favor no responda a este email.
Sistema Orbyt - Gestión Integral
`;
  }

  async clearTemplates() {
    this.logger.log('🧹 Clearing existing email templates...');
    await this.emailTemplateRepository.clear();
    this.logger.log('✅ Email templates cleared!');
  }
}