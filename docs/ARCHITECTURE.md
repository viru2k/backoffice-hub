# Backoffice Hub - Arquitectura del Sistema

## Descripción General

**Backoffice Hub** es el backend principal del ecosistema ORBYT, diseñado como una aplicación SaaS completa para la gestión integral de negocios. Construido con NestJS y TypeScript, proporciona todas las funcionalidades core del negocio para clientes existentes.

## Información Técnica Básica

- **Framework**: NestJS 10.x con TypeScript 5.x
- **Base de Datos**: MySQL con TypeORM
- **Puerto**: 3000 (desarrollo)
- **API Prefix**: `/api`
- **Documentación**: Swagger en `/api`

## Arquitectura de Módulos

### Core Modules (Sistema Base)
- **AuthModule**: Autenticación JWT, registro, gestión de sesiones
- **UserModule**: Gestión de usuarios principales, sub-usuarios, avatars
- **RolesModule**: Control de acceso basado en roles (admin, user)
- **PermissionsModule**: Permisos granulares por funcionalidad
- **SubscriptionModule**: Gestión de suscripciones de clientes
- **SubscriptionPlanModule**: Planes disponibles y características

### Business Logic Modules (Funcionalidades de Negocio)
- **ClientModule**: CRUD de clientes, portal de acceso
- **ServiceModule**: Servicios ofrecidos por el negocio
- **ProductModule**: Gestión de productos/inventario
- **AgendaModule**: Sistema de citas y calendario
- **InvoiceModule**: Facturación y billing
- **ConsultationModule**: Sistema de tokens de consulta
- **RewardsModule**: Sistema de recompensas y fidelización
- **InventoryModule**: Dashboard avanzado de inventario

### Infrastructure Modules (Infraestructura)
- **EmailModule**: Sistema de emails con plantillas
- **NotificationModule**: Notificaciones WebSocket
- **UploadModule**: Gestión de archivos y media
- **DashboardModule**: Métricas y analytics
- **BusinessTypeModule**: Configuración por tipo de negocio
- **SeedModule**: Datos iniciales y migraciones

### Integration Modules (Integraciones)
- **ClientPortalModule**: API para portal de clientes
- **StockModule**: Gestión de stock y movimientos

## Base de Datos (MySQL)

### Entidades Principales
```sql
-- Gestión de Usuarios
users (id, email, name, role, subscription_id)
user_permissions (user_id, permission_id)
roles (id, name, permissions)

-- Business Core
clients (id, user_id, name, email, portal_enabled)
services (id, user_id, name, price, duration)
products (id, user_id, name, stock, price)
appointments (id, user_id, client_id, service_id, date_time)

-- Billing & Subscriptions
invoices (id, user_id, client_id, total, status)
invoice_items (invoice_id, product_id, quantity, price)
subscriptions (id, user_id, plan_id, status)
subscription_plans (id, name, price_monthly, max_users)

-- Inventory & Stock
inventory_movements (id, product_id, type, quantity, date)
stock_alerts (id, product_id, threshold, current_stock)

-- Rewards & Engagement
consultation_tokens (id, user_id, client_id, tokens, expires_at)
rewards (id, user_id, client_id, points, status)
```

## API Structure

### Authentication Endpoints
- `POST /api/auth/register` - Registro de nuevos usuarios
- `POST /api/auth/login` - Autenticación
- `GET /api/auth/profile` - Perfil actual

### Core Business Endpoints
- `GET|POST|PUT|DELETE /api/clients` - Gestión de clientes
- `GET|POST|PUT|DELETE /api/services` - Servicios del negocio
- `GET|POST|PUT|DELETE /api/products` - Productos e inventario
- `GET|POST|PUT|PATCH /api/agenda` - Sistema de citas

### Advanced Features
- `GET /api/dashboard/*` - Analytics y métricas
- `GET|POST /api/consultation/*` - Sistema de tokens
- `GET|POST /api/rewards/*` - Sistema de recompensas
- `GET /api/inventory/dashboard/*` - Dashboard avanzado de inventario
- `GET|POST /api/email/*` - Sistema de emails

### Client Portal Integration
- `GET /api/client-portal/profile/:clientId` - Perfil de cliente
- `GET /api/client-portal/appointments/:clientId` - Citas del cliente
- `GET /api/client-portal/rewards/:clientId` - Recompensas del cliente

## Usuarios Objetivo

### Administradores de Negocio
- **Propietarios de salones de belleza, clínicas, spas**
- **Gerentes de negocios de servicios**
- Acceso completo a todas las funcionalidades
- Gestión de staff, clientes, inventario, citas

### Sub-usuarios/Staff
- **Empleados del negocio**
- Permisos limitados según rol asignado
- Acceso a funcionalidades específicas de su trabajo

### Clientes del Negocio (Via Portal)
- **Clientes finales del negocio**
- Acceso de solo lectura a sus citas
- Visualización de recompensas y tokens
- Actualización limitada de perfil

## Seguridad

### Autenticación
- **JWT Bearer Tokens** con expiración
- **Role-based Access Control (RBAC)**
- **Permission-based Authorization**

### Validación
- **class-validator** para DTOs
- **Validation Pipes** globales
- **CORS** restringido a dominios conocidos

### Data Protection
- **Bcrypt** para passwords
- **File upload** con validaciones
- **SQL injection** protección via TypeORM

## Integración con Otros Servicios

### Con orbyt-landing-service
- **Separación clara de responsabilidades**
- Potencial integración vía API calls o eventos
- Sincronización de usuarios post-registro

### Con orbyt (Frontend)
- **OpenAPI client auto-generado**
- **WebSocket** para notificaciones en tiempo real
- **File upload** para avatars y media

## Deployment & Environment

### Variables de Entorno Requeridas
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=admin123
DB_NAME=backoffice_core

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Email (Queue)
EMAIL_QUEUE_REDIS_HOST=localhost
EMAIL_QUEUE_REDIS_PORT=6379

# File Uploads
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10MB
```

### Scripts Disponibles
```bash
npm run start:dev     # Desarrollo con watch
npm run build         # Build para producción
npm run seed:*        # Scripts de seeding
npm run test          # Tests unitarios
```

## Consideraciones de Desarrollo

### Para Agentes IA
1. **Endpoints privados únicamente** - No crear APIs públicas aquí
2. **Autenticación requerida** - Todos los endpoints necesitan JWT
3. **Separación por usuario** - Datos filtrados por user_id
4. **Validación estricta** - Usar class-validator en todos los DTOs
5. **TypeScript strict** - Tipos explícitos requeridos

### Patrones Implementados
- **Repository Pattern** via TypeORM
- **DTO Pattern** para request/response
- **Guard Pattern** para autorización
- **Interceptor Pattern** para logging/debugging
- **Decorator Pattern** para validación

Este servicio es el **corazón del SaaS ORBYT** y maneja toda la lógica de negocio para clientes que ya están suscritos y utilizando la plataforma.