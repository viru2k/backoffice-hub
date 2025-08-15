# 📧 Sistema de Correos Electrónicos - Orbyt

Este documento describe la implementación del sistema de correos electrónicos en Orbyt, diseñado para manejar notificaciones de seguridad, recuperación de contraseñas y comunicaciones con usuarios.

## 🚀 Características Principales

### ✅ **Tipos de Correos Implementados**

1. **🔐 Recuperación de Contraseña**
   - Enlace seguro de restablecimiento
   - Expiración automática (1 hora)
   - Validación de token único

2. **🔒 Bloqueo de Cuenta**
   - Notificación automática de bloqueo
   - Información de desbloqueo
   - Contacto de soporte

3. **🚨 Alertas de Seguridad**
   - Intentos fallidos de acceso
   - Información de IP y timestamp
   - Recomendaciones de seguridad

4. **✅ Confirmación de Cambio de Contraseña**
   - Notificación de cambio exitoso
   - Fecha y hora del cambio
   - Opciones de reporte de problemas

5. **🎉 Bienvenida**
   - Credenciales de acceso
   - Enlaces de login
   - Guía de características

6. **🧪 Email de Prueba**
   - Verificación de configuración
   - Testing del servicio

## 🏗️ Arquitectura del Sistema

### **Estructura de Archivos**
```
src/email/
├── email.module.ts           # Configuración del módulo
├── email.service.ts          # Servicio principal
└── templates/               # Plantillas de correo
    ├── password-reset.hbs
    ├── account-lockout.hbs
    ├── security-alert.hbs
    ├── password-changed.hbs
    └── welcome.hbs
```

### **Tecnologías Utilizadas**
- **NestJS Mailer**: Framework de correos para NestJS
- **Nodemailer**: Transporte de correos
- **Handlebars**: Motor de plantillas
- **HTML/CSS**: Diseño responsive

## ⚙️ Configuración

### **Variables de Entorno**
```bash
# Configuración del servidor SMTP
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
MAIL_FROM="Orbyt Support" <noreply@orbyt.com>

# Email de soporte
SUPPORT_EMAIL=soporte@orbyt.com
```

### **Proveedores Soportados**
- Gmail (recomendado para desarrollo)
- Outlook/Hotmail
- Yahoo
- Servidores SMTP personalizados
- SendGrid, Mailgun (producción)

## 📋 Uso del Servicio

### **Inyección del Servicio**
```typescript
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly emailService: EmailService
  ) {}
}
```

### **Ejemplos de Uso**

#### **1. Recuperación de Contraseña**
```typescript
await this.emailService.sendPasswordResetEmail({
  email: user.email,
  firstName: user.firstName,
  resetToken: 'abc123...',
  resetLink: 'https://app.orbyt.com/reset-password?token=abc123...'
});
```

#### **2. Notificación de Bloqueo**
```typescript
await this.emailService.sendAccountLockoutEmail({
  email: user.email,
  firstName: user.firstName,
  lockoutTime: '2025-08-15 10:30:00',
  unlockTime: '2025-08-15 11:30:00',
  failedAttempts: 5
});
```

#### **3. Alerta de Seguridad**
```typescript
await this.emailService.sendSecurityAlertEmail(
  user.email,
  user.firstName,
  3, // intentos fallidos
  '2025-08-15 10:25:00',
  '192.168.1.100' // IP opcional
);
```

## 🎨 Diseño de Plantillas

### **Características del Diseño**
- **Responsive**: Compatible con móviles y escritorio
- **Branded**: Colores y tipografía de Orbyt
- **Accesible**: Alto contraste y legibilidad
- **Profesional**: Diseño limpio y moderno

### **Estructura de Plantilla**
```html
<!DOCTYPE html>
<html>
<head>
  <!-- Meta tags y estilos -->
</head>
<body>
  <div class="container">
    <div class="header">
      <!-- Logo y título -->
    </div>
    <div class="content">
      <!-- Contenido principal -->
    </div>
    <div class="footer">
      <!-- Información legal -->
    </div>
  </div>
</body>
</html>
```

## 🔒 Seguridad

### **Medidas Implementadas**
- **Validación de destinatarios**: Solo usuarios autenticados
- **Tokens únicos**: Generación segura de enlaces
- **Expiración temporal**: Enlaces con tiempo límite
- **Logs de auditoría**: Registro de envíos
- **Rate limiting**: Prevención de spam

### **Mejores Prácticas**
- No incluir información sensible en emails
- Usar HTTPS para todos los enlaces
- Implementar verificación de dominio (SPF/DKIM)
- Monitorear tasas de entrega

## 📊 Monitoreo y Logs

### **Logs del Sistema**
```typescript
// Éxito
this.logger.log(`Password reset email sent to ${email}`);

// Error
this.logger.error(`Failed to send email to ${email}`, error);
```

### **Métricas a Monitorear**
- Tasa de entrega exitosa
- Tiempo de respuesta del SMTP
- Emails rebotados
- Errores de configuración

## 🚀 WebSocket + Email Integration

El sistema de emails está integrado con las notificaciones WebSocket:

```typescript
// Notificación por WebSocket + Email
await this.notificationGateway.sendNotificationToUser(userId, notification);
await this.emailService.sendSecurityAlertEmail(email, firstName, attempts);
```

## 🧪 Testing

### **Email de Prueba**
```bash
POST /notifications/test-email
{
  "to": "test@example.com"
}
```

### **Verificación de Configuración**
```typescript
const result = await this.emailService.sendTestEmail('admin@company.com');
console.log('Email test result:', result);
```

## 📈 Próximas Mejoras

### **Funcionalidades Planificadas**
- [ ] **Templates dinámicos**: Editor de plantillas en línea
- [ ] **Analytics**: Métricas de apertura y clicks
- [ ] **Personalización**: Temas por tenant
- [ ] **Programación**: Envío diferido
- [ ] **Attachments**: Soporte para adjuntos

### **Optimizaciones**
- [ ] **Queue system**: Cola de emails con Redis
- [ ] **Bulk sending**: Envío masivo optimizado
- [ ] **A/B Testing**: Pruebas de plantillas
- [ ] **Webhooks**: Eventos de entrega

## 🔧 Troubleshooting

### **Problemas Comunes**

#### **1. Autenticación SMTP Fallida**
```bash
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```
**Solución**: Verificar credenciales y habilitar "App Passwords" en Gmail.

#### **2. Plantilla No Encontrada**
```bash
Error: template not found: password-reset
```
**Solución**: Verificar que las plantillas estén en `src/email/templates/`.

#### **3. Variables No Definidas**
```bash
Error: "firstName" not defined in template
```
**Solución**: Asegurar que todas las variables requeridas se pasen al contexto.

### **Debugging**
```typescript
// Habilitar logs detallados
transport: {
  debug: true,
  logger: true
}
```

## 📞 Soporte

Para reportar problemas o solicitar nuevas funcionalidades:
- **Email**: soporte@orbyt.com
- **Documentación**: [Enlace a docs]
- **Issues**: GitHub Issues

---

**Última actualización**: Agosto 2025  
**Versión**: 1.0.0  
**Autor**: Orbyt Development Team