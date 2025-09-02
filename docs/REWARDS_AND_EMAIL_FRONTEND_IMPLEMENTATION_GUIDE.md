# Guía Completa de Implementación Frontend - Sistema de Recompensas y Emails

Esta guía proporciona las especificaciones exactas para implementar el frontend que consume los sistemas de recompensas y emails que han sido completamente implementados en el backend.

## 🎯 Resumen de lo Implementado en Backend

### ✅ Sistema de Emails COMPLETAMENTE FUNCIONAL
- **Gestión SMTP**: Configuración, validación y pruebas de conexión
- **Plantillas**: CRUD completo con variables dinámicas y Handlebars
- **Envío**: Individual, masivo, por plantillas con cola asíncrona (Bull/Redis)
- **Analytics**: Métricas completas, logs, tracking de opens/clicks
- **Integración**: Hooks automáticos con usuarios, agenda y recompensas

### ✅ Sistema de Recompensas COMPLETAMENTE FUNCIONAL  
- **Programas**: CRUD completo con tipos de negocio
- **Progreso**: Tracking automático por citas, servicios, compras
- **Notificaciones**: Email + WebSocket cuando se ganan recompensas
- **Canje**: Sistema completo de redención
- **Analytics**: Métricas y dashboard de participación

---

## 📧 SISTEMA DE EMAILS - Frontend Implementation

### 1. Dashboard Principal de Emails
**Ruta sugerida:** `/admin/emails/dashboard`

```typescript
interface EmailDashboard {
  // Métricas principales (GET /email/metrics/summary)
  todaysSent: number;
  todaysFailed: number;
  weeklySuccessRate: number;
  activeTemplates: number;
  queuedEmails: number;
  
  // Gráficos (GET /email/metrics)
  dailyStats: { date: string; sent: number; failed: number; pending: number; }[];
  hourlyDistribution: { hour: number; count: number; }[];
  errorAnalysis: { error: string; count: number; percentage: number; }[];
}
```

**Componentes UI necesarios:**
- Cards con métricas principales
- Gráfico de líneas para envíos diarios
- Gráfico de barras para distribución horaria
- Lista de errores más comunes
- Estado en tiempo real de la cola

### 2. Configuración SMTP
**Ruta sugerida:** `/admin/emails/settings`

```typescript
interface SMTPSettings {
  provider: 'gmail' | 'outlook' | 'yahoo' | 'custom';
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;
  isActive: boolean;
}
```

**APIs a consumir:**
- `GET /email/settings` - Obtener configuración actual
- `POST /email/settings` - Guardar nueva configuración
- `PUT /email/settings/:id` - Actualizar configuración
- `POST /email/settings/test` - Probar conexión SMTP

**Funcionalidades UI:**
- Formulario de configuración SMTP
- Dropdown de providers con configuraciones pre-definidas
- Botón "Probar Conexión" con feedback visual
- Toggle para activar/desactivar configuración
- Indicadores de estado de la última prueba

### 3. Gestión de Plantillas
**Ruta sugerida:** `/admin/emails/templates`

```typescript
interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  type: 'welcome' | 'password_reset' | 'appointment_reminder' | 'appointment_confirmation' | 'reward_notification' | 'custom';
  variables: string[];
  isActive: boolean;
  description?: string;
  usageCount: number;
  lastUsed?: Date;
}
```

**APIs a consumir:**
- `GET /email/templates` - Listar todas las plantillas
- `POST /email/templates` - Crear plantilla
- `GET /email/templates/:id` - Obtener plantilla por ID
- `PUT /email/templates/:id` - Actualizar plantilla
- `DELETE /email/templates/:id` - Eliminar plantilla

**Funcionalidades UI:**
- Tabla con filtros por tipo y estado
- Editor WYSIWYG para contenido HTML
- Preview de plantilla con variables de ejemplo
- Listado de variables disponibles
- Estadísticas de uso por plantilla
- Templates predefinidos por tipo de negocio

### 4. Envío de Emails
**Ruta sugerida:** `/admin/emails/send`

```typescript
interface SendEmail {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  htmlContent?: string;
  textContent?: string;
  templateId?: string;
  templateVariables?: Record<string, any>;
  attachments?: EmailAttachment[];
  priority?: 'low' | 'normal' | 'high';
}
```

**APIs a consumir:**
- `POST /email/send` - Enviar email personalizado
- `POST /email/send/template` - Enviar con plantilla
- `POST /email/send/bulk` - Envío masivo

**Funcionalidades UI:**
- Composer de email con opciones avanzadas
- Selector de plantillas con preview
- Drag & drop para archivos adjuntos
- Selector múltiple de destinatarios
- Preview antes del envío
- Programación de envío (scheduled)

### 5. Logs y Analytics
**Ruta sugerida:** `/admin/emails/logs`

```typescript
interface EmailLog {
  id: string;
  to: string[];
  subject: string;
  status: 'sent' | 'failed' | 'pending' | 'scheduled';
  createdAt: Date;
  sentAt?: Date;
  failedAt?: Date;
  errorMessage?: string;
  templateUsed?: string;
  deliveryStats?: { opens: number; clicks: number; bounces: number; };
}
```

**APIs a consumir:**
- `GET /email/logs` - Logs paginados con filtros
- `GET /email/logs/failed` - Solo emails fallidos
- `POST /email/logs/retry/:logId` - Reintentar email fallido

**Funcionalidades UI:**
- Tabla de logs con filtros avanzados
- Estados visuales para cada email
- Botón de reintento para emails fallidos
- Modal con detalles completos del log
- Exportación de logs en CSV/Excel

### 6. Cola de Emails
**Ruta sugerida:** `/admin/emails/queue`

**APIs a consumir:**
- `GET /email/queue/stats` - Estadísticas de cola
- `POST /email/queue/pause` - Pausar cola
- `POST /email/queue/resume` - Reanudar cola
- `POST /email/queue/clean` - Limpiar cola

**Funcionalidades UI:**
- Monitor en tiempo real de la cola
- Controles para pausar/reanudar
- Estadísticas de trabajos procesados
- Alerta cuando hay muchos fallos

---

## 🎁 SISTEMA DE RECOMPENSAS - Frontend Implementation

### 1. Dashboard de Recompensas
**Ruta sugerida:** `/admin/rewards/dashboard`

```typescript
interface RewardsDashboard {
  totalActivePrograms: number;
  totalActiveRewards: number;
  totalEarnedRewards: number;
  totalRedeemedRewards: number;
  // Gráficos adicionales según necesidades
}
```

**APIs a consumir:**
- `GET /rewards/metrics` - Métricas del sistema

**Funcionalidades UI:**
- Cards con métricas principales
- Gráficos de participación por programa
- Distribución de recompensas por tipo de negocio
- Tendencias de canje por período

### 2. Gestión de Programas de Recompensas
**Ruta sugerida:** `/admin/rewards/programs`

```typescript
interface RewardProgram {
  id: number;
  name: string;
  description?: string;
  conditionType: 'VISIT_COUNT' | 'PURCHASE_AMOUNT' | 'SERVICE_COUNT' | 'CONSULTATION_COUNT';
  conditionValue: number;
  rewardType: 'DISCOUNT_PERCENTAGE' | 'DISCOUNT_AMOUNT' | 'FREE_SERVICE' | 'POINTS';
  rewardValue: number;
  maxUsesPerCustomer: number;
  validFrom?: Date;
  validUntil?: Date;
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
  businessType?: BusinessType;
}
```

**APIs a consumir:**
- `GET /rewards/programs` - Listar todos los programas
- `POST /rewards/programs` - Crear programa
- `GET /rewards/programs/:id` - Obtener programa
- `PATCH /rewards/programs/:id` - Actualizar programa
- `DELETE /rewards/programs/:id` - Eliminar programa
- `GET /rewards/programs/business-type/:id` - Por tipo de negocio

**Funcionalidades UI:**
- Tabla con filtros por tipo de negocio y estado
- Formulario de creación/edición con validaciones
- Preview de cómo se ve para el cliente
- Templates predefinidos por tipo de negocio
- Estados visuales (ACTIVE, INACTIVE, DRAFT)
- Wizard paso a paso para crear programas

### 3. Vista de Cliente con Recompensas
**Integrar en:** Perfil de cliente existente

```typescript
interface CustomerReward {
  id: number;
  currentProgress: number;
  targetValue: number;
  status: 'IN_PROGRESS' | 'EARNED' | 'REDEEMED' | 'EXPIRED';
  earnedAt?: Date;
  redeemedAt?: Date;
  expiresAt?: Date;
  rewardProgram: RewardProgram;
}
```

**APIs a consumir:**
- `GET /rewards/customer/:clientId` - Todas las recompensas
- `GET /rewards/customer/:clientId/active` - En progreso
- `GET /rewards/customer/:clientId/earned` - Listas para canjear
- `GET /rewards/customer/:clientId/history` - Historial
- `POST /rewards/customer/:clientId/redeem/:rewardId` - Canjear

**Funcionalidades UI:**
- Panel de recompensas en perfil de cliente
- Barras de progreso animadas
- "X de Y completado" con tiempo restante
- Lista de recompensas disponibles para canjear
- Modal de confirmación de canje
- Historial con filtros por estado
- Notificaciones cuando está cerca de completar

### 4. Sistema de Notificaciones
**Integrar en:** Layout principal

```typescript
interface RewardNotification {
  type: 'reward_earned' | 'reward_progress_updated' | 'reward_about_to_expire';
  title: string;
  message: string;
  metadata: {
    clientId: number;
    programId: number;
    rewardType: string;
    rewardValue: number;
  };
}
```

**WebSocket Events:**
```typescript
// Conectar a /notifications WebSocket
socket.on('notification', (notification: RewardNotification) => {
  switch(notification.type) {
    case 'reward_earned':
      showSuccess('🎁 ¡Recompensa ganada!', notification.message);
      break;
    case 'reward_progress_updated':
      showInfo('📈 Progreso actualizado', notification.message);
      break;
    case 'reward_about_to_expire':
      showWarning('⏰ Recompensa por expirar', notification.message);
      break;
  }
});
```

**APIs a consumir:**
- `GET /notifications` - Todas las notificaciones
- `GET /notifications/unread` - No leídas
- `GET /notifications/summary` - Resumen dashboard

**Funcionalidades UI:**
- Campana de notificaciones con contador
- Dropdown con lista de notificaciones recientes
- Toast notifications diferenciadas por tipo
- Página dedicada de notificaciones
- Marcar como leída/no leída
- Filtros por tipo de notificación

---

## 🔧 INTEGRACIONES AUTOMÁTICAS YA IMPLEMENTADAS

### Triggers Automáticos (No requieren UI adicional)
Estos endpoints se ejecutan automáticamente desde otros módulos:

```typescript
// Cuando se completa una cita
POST /rewards/trigger/appointment-completed/:clientId

// Cuando se completa una consulta  
POST /rewards/trigger/consultation-completed/:clientId

// Cuando se completa un servicio
POST /rewards/trigger/service-completed/:clientId

// Cuando se realiza una compra
POST /rewards/trigger/purchase-completed/:clientId
```

### Emails Automáticos (Ya configurados)
- **Email de bienvenida**: Se envía automáticamente al registrar usuario
- **Reset de contraseña**: Se envía al solicitar cambio de contraseña
- **Confirmación de cita**: Se envía al crear nueva cita
- **Recordatorio de cita**: Cron job automático
- **Recompensa ganada**: Se envía automáticamente cuando se completa programa

---

## 📱 CONSIDERACIONES DE UX/UI

### Responsive Design
- Todas las interfaces deben ser completamente responsive
- Priorizar mobile-first para vistas de cliente
- Dashboard optimizado para tablet/desktop

### Gamificación
- Animaciones al completar recompensas
- Badges visuales por tipo de recompensa
- Celebración visual al ganar recompensa
- Barras de progreso interactivas con tooltips
- Indicadores de "próximo a completar"

### Estados de Loading y Error
- Skeleton loading para todas las tablas
- Estados de error específicos por operación
- Confirmaciones antes de eliminar/modificar
- Feedback visual inmediato en todas las acciones

### Notificaciones
- Toast notifications con iconos distintivos
- Sound notifications para recompensas importantes
- Push notifications cuando sea posible
- Agrupación inteligente de notificaciones

---

## 🚀 ORDEN DE IMPLEMENTACIÓN RECOMENDADO

### Fase 1: Email System (2 semanas)
1. Dashboard de métricas básicas
2. Configuración SMTP 
3. Gestión de plantillas (CRUD básico)
4. Logs y analytics

### Fase 2: Rewards System (2 semanas)
1. Dashboard de recompensas
2. Gestión de programas
3. Vista de cliente básica
4. Sistema de notificaciones

### Fase 3: Integración y UX (1 semana)
1. WebSocket para notificaciones en tiempo real
2. Animaciones y gamificación
3. Estados de loading/error refinados
4. Testing integral

---

## 🔑 VARIABLES DE ENTORNO NECESARIAS

```env
# Email System
EMAIL_QUEUE_REDIS_HOST=localhost
EMAIL_QUEUE_REDIS_PORT=6379
EMAIL_ENCRYPTION_KEY=your-32-char-encryption-key
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
MAIL_FROM="Orbyt Support" <noreply@orbyt.com>

# Frontend URLs (para links en emails)
FRONTEND_URL=http://localhost:3000
```

---

## ✅ TESTING

### Email System Tests
- [ ] Configurar SMTP y probar conexión
- [ ] Crear plantilla y enviar email de prueba
- [ ] Verificar logs y métricas
- [ ] Probar envío masivo
- [ ] Validar cola de procesamiento

### Rewards System Tests  
- [ ] Crear programa de recompensas
- [ ] Simular progreso de cliente
- [ ] Verificar notificación automática
- [ ] Probar proceso de canje
- [ ] Validar métricas del dashboard

### Integration Tests
- [ ] Completar cita → progreso en recompensas → email automático
- [ ] WebSocket notifications funcionando
- [ ] Responsive design en todos los dispositivos

---

**🎯 RESULTADO FINAL:** Un sistema completo de gestión de emails y recompensas con interfaz administrativa profesional, notificaciones en tiempo real, y experiencia de usuario gamificada para el cliente.