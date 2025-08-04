# Contexto del Proyecto: Backoffice Hub API para Gemini

Este documento sirve como una "memoria" para el asistente de IA (Gemini) sobre la arquitectura, decisiones y estado actual del proyecto Backoffice Hub.

## 1. Descripción General del Proyecto

-   **Objetivo**: Crear una API backend modular y escalable para un sistema SaaS (Software as a Service).
-   **Modelo**: Multi-tenant, donde cada "cuenta" (cliente del SaaS) tiene un usuario administrador y varios sub-usuarios con diferentes roles.
-   **Stack Tecnológico**:
    -   **Framework**: NestJS (TypeScript)
    -   **Base de Datos**: MySQL 8.0
    -   **ORM**: TypeORM
    -   **Autenticación**: Passport.js con estrategias `local` (email/password) y `jwt`.
    -   **Entorno**: Docker y Docker Compose.
    -   **Documentación API**: Swagger (OpenAPI).

---

## 2. Arquitectura Principal

### Control de Acceso Basado en Roles (RBAC)

Este es el núcleo del sistema de seguridad.
-   **`Permission` (Permiso)**: Representa una acción atómica. Se define con el formato `recurso:acción:ámbito`.
    -   Ejemplos: `agenda:read:own`, `agenda:read:group`, `user:manage:group`.
-   **`Role` (Rol/Perfil)**: Un conjunto de `Permission`. Define una función laboral.
    -   Ejemplos: "Admin de Cuenta", "Profesional", "Secretaria".
-   **`User` (Usuario)**: Se le asignan uno o más `Role`. Un usuario hereda todos los permisos de los roles que tiene asignados.

### Jerarquía de Cuentas (Tenant)

-   Un usuario "dueño" (`owner`) es el administrador de la cuenta.
-   Este `owner` puede crear otros usuarios (`sub-usuarios`) que pertenecen a su mismo grupo.
-   La visibilidad de los datos se restringe por grupo. Un usuario solo puede ver datos de otros usuarios si pertenece al mismo grupo y si su rol tiene un permiso con ámbito `:group`.

### Guards y Decoradores

-   **`@Permissions(...)`**: Decorador personalizado (`src/common/decorators/permissions.decorator.ts`) que se aplica a las rutas del controlador para especificar qué permisos se requieren.
-   **`PermissionsGuard`**: Guardia personalizado (`src/common/guards/permissions.guard.ts`) que se activa en cada petición. Lee los permisos requeridos por la ruta y los compara con los permisos efectivos del usuario (obtenidos a través de sus roles).

---

## 3. Archivos y Lógica Clave

-   **`docker-compose.yml`**: Define los servicios `app` y `db`. El servicio `app` ejecuta el seed automáticamente.
-   **`src/seed/full-flow-extended.seed.ts`**: Script principal para poblar la base de datos con datos de prueba realistas (roles, permisos, usuarios, clientes, etc.).
-   **`src/auth/common/local.strategy.ts`**: Valida el email y la contraseña durante el login.
-   **`src/auth/common/jwt.strategy.ts`**: Valida el token JWT en cada petición a una ruta protegida.
-   **`src/auth/auth.service.ts`**: Contiene la lógica para `validateUser` (verificar credenciales y estado `isActive`) y `login` (generar el token).
-   **Entidades RBAC**:
    -   `src/user/entities/user.entity.ts` (relación `ManyToMany` con `Role`)
    -   `src/roles/entities/role.entity.ts` (relación `ManyToMany` con `Permission`)
    -   `src/permissions/entities/permission.entity.ts`

---

## 4. Flujo de Trabajo y Comandos

-   **Levantar el entorno (con seed)**:
    ```bash
    docker-compose down -v && docker-compose up --build
    ```
-   **Limpiar la base de datos (script SQL)**:
    ```sql
    SET FOREIGN_KEY_CHECKS = 0;
    TRUNCATE TABLE ...; -- (Lista completa de tablas)
    SET FOREIGN_KEY_CHECKS = 1;
    ```
-   **Probar la API**:
    -   La documentación de Swagger está disponible en `http://localhost:3000/api`.
    -   El flujo de prueba principal es iniciar sesión con diferentes roles (Admin, Secretaria, Profesional) y verificar que los permisos se apliquen correctamente.