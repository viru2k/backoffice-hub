# Documentación de Arquitectura: Backoffice Hub API

Este documento describe la arquitectura, las tecnologías y las relaciones de datos del proyecto Backoffice Hub. Su objetivo es servir como guía para desarrolladores y agentes de IA para entender el sistema, mantenerlo y escribir pruebas eficaces.

## 1. Visión General y Tecnología

-   **Propósito del Proyecto**: Es una API backend modular y escalable para un sistema SaaS (Software as a Service) multi-tenant. Permite a diferentes "cuentas" gestionar sus propias operaciones de negocio (clientes, productos, agendas, etc.) con un sistema de permisos granular.
-   **Stack Tecnológico**:
    -   **Framework**: NestJS (TypeScript)
    -   **Base de Datos**: MySQL 8.0
    -   **ORM**: TypeORM
    -   **Autenticación**: Passport.js con estrategias `local` (email/password) y `jwt`.
    -   **Entorno**: Docker y Docker Compose para un desarrollo y despliegue consistentes.
    -   **Documentación API**: Swagger (OpenAPI).

---

## 2. Arquitectura y Conceptos Clave

### 2.1. Control de Acceso Basado en Roles (RBAC)

Este es el pilar de la seguridad del sistema. Permite una flexibilidad total para definir qué puede hacer cada tipo de usuario.

-   **`Permission` (Permiso)**: Es la unidad de autorización más pequeña. Representa una acción única y se define con el formato `recurso:acción:ámbito`.
    -   **Recurso**: La entidad sobre la que se actúa (`agenda`, `client`, `user`).
    -   **Acción**: Lo que se hace (`read`, `write`, `manage`).
    -   **Ámbito**: El alcance de la acción (`own` para recursos propios, `group` para recursos del mismo grupo/cuenta).
    -   *Ejemplo*: `agenda:read:group` permite leer las agendas de todos los usuarios de la misma cuenta.
-   **`Role` (Rol)**: Es un perfil de trabajo (ej. "Secretaria", "Profesional") que agrupa un conjunto de `Permission`. Un rol define las capacidades de un usuario.
-   **`User` (Usuario)**: Cada usuario tiene asignado uno o más `Role`. Un usuario hereda la suma de todos los permisos de los roles que tiene asignados.

**Relación**: `User <--> Role <--> Permission`

### 2.2. Jerarquía de Cuentas (Multi-tenancy)

El sistema aísla los datos de diferentes clientes del SaaS a través de una jerarquía simple.

-   Un `User` puede tener un `owner`, que es otro `User`.
-   El `User` que no tiene `owner` es el **Administrador de la Cuenta**.
-   Todos los usuarios que comparten el mismo `owner` pertenecen al mismo **grupo** o **tenant**.
-   **Razón de ser**: Esta estructura garantiza que un usuario de la "Clínica Visión" nunca pueda ver o modificar datos de la "Peluquería Glamour". La lógica de negocio siempre filtra por el `ownerId`.

### 2.3. Guards y Decoradores

-   **`@Permissions(...)`**: Un decorador personalizado que se coloca en las rutas de los controladores para declarar qué permisos se necesitan para acceder a ellas.
-   **`PermissionsGuard`**: Un guardián de NestJS que se activa en cada petición. Comprueba los permisos requeridos por la ruta (definidos por el decorador) contra los permisos que el usuario posee a través de sus roles. Si no hay coincidencia, deniega el acceso con un error `403 Forbidden`.

---

## 3. Relaciones entre Entidades

### Diagrama Simplificado
`SubscriptionPlan -> Subscription -> User (owner) -> User (sub-user) -> Role -> Permission`
`User -> Client -> Appointment <- User (professional)`
`User -> Product -> StockMovement`

### Desglose Detallado

-   **`User`**: Es la entidad central.
    -   **Relación consigo misma**: `owner` (ManyToOne) y `subUsers` (OneToMany) para crear la jerarquía de cuentas.
    -   **Relación con `Role`** (ManyToMany): Un usuario puede ser "Secretaria" y "Facturación" al mismo tiempo. Un rol puede ser asignado a muchos usuarios.
    -   **Relación con `Subscription`** (OneToMany): El usuario `owner` tiene las suscripciones que definen los límites de la cuenta (ej. `maxUsers`).
    -   **Relación con `Client`, `Product`, `AgendaConfig`** (OneToMany): Un usuario es "dueño" de clientes, productos y configuraciones de agenda.
    -   **Relación con `Appointment`** (OneToMany como `professional`): Un usuario es el profesional que atiende una cita.

-   **`Role` y `Permission`**:
    -   **Relación** (ManyToMany): Un rol como "Secretaria" necesita muchos permisos (`agenda:read:group`, `agenda:write:group`, `client:manage:group`). Un permiso como `client:manage:group` se puede asignar a varios roles ("Secretaria", "Admin de Cuenta").

-   **`Client`**:
    -   **Relación con `User`** (ManyToOne como `owner`): Define a qué cuenta pertenece el cliente.
    -   **Relación con `Appointment`** (OneToMany): Un cliente puede tener muchas citas.

-   **`Appointment`**:
    -   **Relación con `User`** (ManyToOne como `professional`): La cita es atendida por un profesional específico.
    -   **Relación con `Client`** (ManyToOne): La cita es para un cliente específico.
    -   **Razón de ser**: Es el nexo de unión entre quién atiende (`professional`), a quién se atiende (`client`), y cuándo ocurre (`startDateTime`, `endDateTime`).

-   **`SubscriptionPlan` y `Subscription`**:
    -   **Relación**: `SubscriptionPlan` (OneToMany) -> `Subscription` (ManyToOne) -> `User`.
    -   **Razón de ser**: Separa los planes disponibles (`SubscriptionPlan`) de las suscripciones activas de cada cliente (`Subscription`). Esto permite que un usuario cambie de plan o que los precios de los planes se actualicen sin afectar a las suscripciones ya contratadas. La propiedad `maxUsers` en el plan es crucial para limitar la creación de sub-usuarios.

---

## 4. Guía para Escribir Tests

Con esta arquitectura en mente, los tests deben centrarse en verificar las reglas de negocio y los límites de seguridad.

### Tests de Autenticación y Autorización (E2E)

-   **Login**:
    -   Probar que un usuario con credenciales válidas y `isActive: true` recibe un token.
    -   Probar que un usuario con `isActive: false` recibe un `401 Unauthorized`.
-   **Acceso a Rutas**:
    -   **Escenario 1 (Secretaria)**: Loguearse como "Secretaria".
        -   **Probar Éxito**: Verificar que puede acceder a `GET /agenda?professionalId=<id_medico>`.
        -   **Probar Fallo**: Verificar que recibe `403 Forbidden` al intentar acceder a `GET /users/group`.
    -   **Escenario 2 (Profesional)**: Loguearse como "Profesional".
        -   **Probar Éxito**: Verificar que puede acceder a `GET /agenda` (su propia agenda).
        -   **Probar Fallo**: Verificar que recibe `403 Forbidden` al intentar acceder a `GET /agenda?professionalId=<id_otro_medico>`.
-   **Aislamiento de Cuentas (Tenant)**:
    -   Loguearse como admin de la "Peluquería".
    -   Intentar acceder a `GET /clients?userId=<id_medico_clinica>`.
    -   **Probar Fallo**: Verificar que se recibe un `403 Forbidden` porque el usuario objetivo no pertenece a su grupo.

### Tests de Lógica de Negocio (Unitarios y E2E)

-   **Gestión de Usuarios**:
    -   Como `Admin`, crear un sub-usuario. Verificar que el `owner` se asigna correctamente.
    -   Como `Admin`, intentar crear más usuarios de los permitidos por el `SubscriptionPlan`. Verificar que se recibe un `400 Bad Request`.
-   **Agenda**:
    -   Como `Secretaria`, crear una cita para un `Profesional`. Verificar que la cita se crea con el `professionalId` correcto.
    -   Como `Profesional`, intentar crear una cita para otro `Profesional`. Verificar que el servicio lanza una `ForbiddenException`.
-   **Stock**:
    -   Crear un `StockMovement` de tipo `IN`. Verificar que la cantidad total de stock para ese producto se actualiza correctamente.
    -   Crear un `StockMovement` de tipo `OUT`. Verificar que la cantidad total disminuye.