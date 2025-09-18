# Backoffice Hub - Contexto para Agentes IA

## ¿Qué es este servicio?

**Backoffice Hub** es el **backend principal** del ecosistema ORBYT. Es una aplicación SaaS completa construida con NestJS que proporciona TODAS las funcionalidades core del negocio para clientes que ya están suscritos y utilizando la plataforma.

## Información Rápida

- **Tecnología**: NestJS 10 + TypeScript + MySQL + TypeORM
- **Puerto**: 3000 (desarrollo)
- **Usuarios**: Administradores de negocios, staff, y clientes (via portal)
- **Propósito**: Backend completo del SaaS con toda la lógica de negocio

## ¿Qué hace este servicio?

### Core del SaaS - Toda la Lógica de Negocio
1. **Autenticación y Usuarios** - Sistema completo de auth + RBAC
2. **Gestión de Clientes** - CRUD de customers + portal de acceso
3. **Sistema de Citas** - Backend del calendario y agendamiento
4. **Inventario Completo** - Productos, stock, movimientos, dashboard
5. **Facturación** - Sistema completo de billing e invoicing
6. **Sistema de Recompensas** - Programa de lealtad y fidelización
7. **Tokens de Consulta** - Sistema especializado de consultas
8. **Emails Automatizados** - Sistema completo con templates y colas
9. **Dashboard Analytics** - Métricas, reportes y analytics
10. **Portal de Clientes** - APIs para que clientes accedan a sus datos

### Características Técnicas
- **Arquitectura Modular** con 20+ módulos especializados
- **TypeORM + MySQL** para persistencia robusta
- **JWT + RBAC** para seguridad granular
- **WebSocket** para notificaciones real-time
- **Bull + Redis** para colas de email
- **OpenAPI/Swagger** para documentación automática
- **Multi-tenant** por user_id

## Dependencias de Otros Servicios

### 🔴 CLIENTE PRINCIPAL: orbyt (frontend)
```
orbyt (4200) → backoffice-hub (3000)
```
- **Relación**: Este backend sirve al frontend principal
- **Comunicación**: HTTP REST + WebSocket
- **Autenticación**: JWT Bearer tokens que genera este servicio
- **OpenAPI**: Este backend genera el spec que consume el frontend

#### APIs que DEBE proporcionar:
- ✅ `/api/auth/*` - Login, registro, perfiles
- ✅ `/api/users/*` - Gestión de staff y sub-usuarios  
- ✅ `/api/clients/*` - CRUD de clientes del negocio
- ✅ `/api/services/*` - Servicios que ofrece el negocio
- ✅ `/api/products/*` - Productos e inventario
- ✅ `/api/agenda/*` - Sistema completo de citas
- ✅ `/api/dashboard/*` - Analytics y métricas
- ✅ `/api/consultation/*` - Tokens de consulta
- ✅ `/api/rewards/*` - Sistema de recompensas
- ✅ `/api/email/*` - Gestión de emails y templates
- ✅ `/api/inventory/*` - Dashboard avanzado de inventario
- ✅ `/api/client-portal/*` - Portal para clientes finales

### ⚪ POTENCIAL INTEGRACIÓN: orbyt-landing-service
```
orbyt-landing-service (3001) ↔ backoffice-hub (3000)
```
- **Relación**: Servicios independientes con integración futura
- **Escenario**: Cuando landing-service complete un pago exitoso
- **Integración**: Landing-service podría llamar APIs de este servicio para crear usuario
- **Estado actual**: Sin integración directa

### ⚪ INDEPENDIENTE: orbyt-landing (frontend)
- **NO tiene relación directa**
- Landing frontend se conecta a orbyt-landing-service, no a este backend

## Tipos de Usuarios

### 1. Administradores de Negocio (Owner/Admin)
- **Role**: `admin` 
- **Acceso**: Completo a TODAS las funcionalidades
- **Casos de uso**:
  - Gestionar todo el negocio
  - Crear/editar staff (sub-usuarios)
  - Configurar servicios y precios
  - Ver analytics completos
  - Administrar portal de clientes
  - Gestionar facturación

### 2. Staff/Empleados (User)
- **Role**: `user`
- **Acceso**: Limitado según permisos asignados
- **Casos de uso**:
  - Ver/gestionar citas asignadas
  - Gestionar clientes (si tiene permisos)
  - Usar productos del inventario
  - Ver métricas limitadas

### 3. Clientes del Negocio (Via Portal)
- **Role**: Sin role (acceso via client-portal APIs)
- **Acceso**: Solo sus propios datos, read-only mayormente
- **Casos de uso**:
  - Ver sus citas programadas
  - Ver recompensas acumuladas
  - Ver tokens de consulta
  - Actualizar datos personales (limitado)

## Arquitectura de Módulos

### Core Modules (Infraestructura)
- `AuthModule` - JWT, login, registro, guards
- `UserModule` - Gestión de usuarios principales y staff
- `RolesModule` - Sistema de roles (admin/user)
- `PermissionsModule` - Permisos granulares

### Business Modules (Lógica de Negocio)
- `ClientModule` - CRUD clientes + portal
- `ServiceModule` - Servicios del negocio
- `ProductModule` - Productos e inventario básico
- `InventoryModule` - Dashboard avanzado de inventario
- `AgendaModule` - Sistema completo de citas
- `InvoiceModule` - Facturación y billing
- `ConsultationModule` - Tokens de consulta
- `RewardsModule` - Sistema de recompensas
- `DashboardModule` - Analytics y reportes

### Infrastructure Modules
- `EmailModule` - Sistema de emails con Bull/Redis
- `NotificationModule` - WebSocket notifications
- `UploadModule` - Gestión de archivos
- `ClientPortalModule` - APIs para portal de clientes
- `SeedModule` - Datos iniciales y migraciones

### Integration Modules  
- `SubscriptionModule` - Gestión de suscripciones
- `SubscriptionPlanModule` - Planes disponibles
- `BusinessTypeModule` - Configuración por tipo de negocio

## Configuración de Desarrollo

### Variables de Entorno Críticas
```env
# Database (MySQL)
DB_HOST=localhost
DB_PORT=3306  
DB_USER=root
DB_PASSWORD=admin123
DB_NAME=backoffice_core

# JWT
JWT_SECRET=your-super-secure-secret
JWT_EXPIRES_IN=24h

# Redis (para emails)
EMAIL_QUEUE_REDIS_HOST=localhost
EMAIL_QUEUE_REDIS_PORT=6379

# File uploads
UPLOAD_PATH=./uploads
```

### Comandos Importantes
```bash
# Desarrollo con watch
npm run start:dev

# Build para producción  
npm run build

# Seeds/datos iniciales
npm run seed:full-flow-extended

# Tests
npm run test

# TypeScript check
npx tsc --noEmit
```

## Base de Datos (MySQL)

### Tablas Principales
- **users** - Usuarios principales (admins/owners)
- **clients** - Clientes del negocio
- **services** - Servicios ofrecidos
- **products** - Productos e inventario
- **appointments** - Citas agendadas
- **invoices** + **invoice_items** - Facturación
- **subscriptions** - Suscripciones activas
- **consultation_tokens** - Sistema de tokens
- **rewards** - Recompensas de clientes

### Patrones Importantes
- **Multi-tenant**: Todos los datos filtrados por `user_id`
- **Soft deletes**: Algunos módulos usan borrado lógico
- **Audit trail**: Timestamps en todas las entidades
- **Relations**: Extenso uso de relaciones TypeORM

## Para Agentes IA: Guías Rápidas

### ✅ Qué PUEDES hacer aquí:
- Crear nuevos endpoints de API
- Implementar lógica de negocio compleja
- Crear nuevos módulos especializados
- Gestionar base de datos y migraciones
- Implementar validaciones robustas
- Crear seeds y datos de prueba
- Integrar servicios externos (email, websockets)
- Generar reportes y analytics

### ❌ Qué NO hacer aquí:
- UI/UX (eso va en el frontend orbyt)
- Procesamiento de pagos (va en orbyt-landing-service) 
- Landing page logic (va en orbyt-landing-service)
- Código que no esté relacionado con la lógica core del SaaS

### 🔧 Workflow típico para nuevas features:
1. **Crear módulo** si es feature grande
2. **Crear entity** con TypeORM
3. **Crear DTOs** para request/response
4. **Crear service** con lógica de negocio
5. **Crear controller** con endpoints
6. **Agregar validaciones** con class-validator
7. **Añadir al módulo padre** (app.module.ts)
8. **Frontend**: Regenerar cliente OpenAPI

### 🚨 Puntos críticos:
- **SIEMPRE filtrar por user_id** (multi-tenant)
- **SIEMPRE usar DTOs** para validación
- **SIEMPRE usar Guards** para autorización
- **JWT requerido** en todos los endpoints (excepto auth)
- **Validación robusta** con class-validator
- **Error handling** consistente
- **OpenAPI docs** siempre actualizadas

### 🎯 Principios de diseño:
- **Modular**: Un módulo por feature de negocio
- **Secure**: JWT + RBAC en todo
- **Multi-tenant**: Separación por user_id
- **Validated**: DTOs con class-validator
- **Documented**: OpenAPI/Swagger actualizado
- **Tested**: Tests unitarios para lógica crítica

## Estado Actual

El backend está **completamente funcional** y sirviendo al frontend principal:
- ✅ 20+ módulos implementados
- ✅ Sistema de auth completo
- ✅ CRUD de todas las entidades principales
- ✅ Dashboard analytics
- ✅ Sistema de citas avanzado
- ✅ Facturación completa
- ✅ Sistema de recompensas
- ✅ Portal de clientes
- ✅ Sistema de emails automatizados
- ✅ WebSocket notifications
- ✅ OpenAPI documentation

**Es el backend principal del SaaS y está sirviendo clientes en producción.**

### Próximas integraciones:
- Potencial integración con orbyt-landing-service para onboarding
- APIs adicionales según necesidades del frontend
- Métricas y analytics más avanzados