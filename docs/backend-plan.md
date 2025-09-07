# Plan de Trabajo y Evaluación: Backoffice Hub API

Este documento detalla el análisis del backend y el plan de acción para mejorar su robustez, seguridad y cobertura de pruebas.

## Metodología

1.  **Análisis por Módulo (Controlador)**: Cada módulo principal de la API será evaluado individualmente.
2.  **Endpoints**: Se describirá cada endpoint, su propósito y los datos que maneja.
3.  **Seguridad**: Se verificará que cada endpoint tenga la protección adecuada (autenticación y permisos).
4.  **Relaciones**: Se identificarán las conexiones entre los módulos.
5.  **Plan de Acción**: Se definirán los pasos a seguir, incluyendo la creación de tests (unitarios y e2e), la validación de la lógica y la posible actualización del `seed`.

---

## Step 1: Auth Controller (`auth.controller.ts`)

### Análisis

-   **Responsabilidad**: Gestionar el registro de nuevos usuarios (cuentas principales), el login y la obtención del perfil del usuario autenticado.
-   **Seguridad**:
    -   `POST /register`: Endpoint público.
    -   `POST /login`: Protegido por `AuthGuard('local')`, que valida email/contraseña.
    -   `GET /profile`: Protegido por `AuthGuard('jwt')`, requiere un token válido.
-   **Relaciones**:
    -   **User**: Crea y valida usuarios.
    -   **Subscription**: Crea una suscripción al registrar un nuevo usuario.
    -   **SubscriptionPlan**: Consulta los planes para asignar uno nuevo.
    -   **Role/Permission**: El perfil devuelto (`/profile`) incluye información de roles y permisos computados.

### Endpoints y Plan de Acción

-   `POST /register`
    -   **Descripción**: Registra un nuevo administrador de cuenta, le crea una suscripción y devuelve un token de acceso.
    -   **Checklist**:
        -   [x] **Validación**: La lógica parece correcta. El `AuthService` maneja la creación del usuario y la suscripción.
        -   [x] **Test**: Crear un test e2e que simule el registro completo, verificando que el usuario y la suscripción se creen en la BD y que se devuelva un token válido.
        -   [ ] **Seed**: El `seed` ya crea usuarios administradores, por lo que no es necesario actualizarlo para este endpoint.

-   `POST /login`
    -   **Descripción**: Autentica a un usuario con email y contraseña y devuelve un token de acceso.
    -   **Checklist**:
        -   [x] **Validación**: La `LocalStrategy` y el `AuthService` manejan la validación correctamente, incluyendo el estado `isActive` del usuario.
        -   [x] **Test**: Crear un test e2e para el login con credenciales válidas, inválidas y de un usuario inactivo.
        -   [ ] **Seed**: El `seed` provee múltiples usuarios con diferentes roles para probar el login.

-   `GET /profile`
    -   **Descripción**: Devuelve la información del usuario autenticado, incluyendo roles y permisos computados.
    -   **Checklist**:
        -   [x] **Validación**: El mapeo a `ProfileResponseDto` es correcto y calcula los permisos booleanos (`canManage...`) de forma eficiente.
        -   [x] **Test**: Crear un test e2e que, usando un token válido, verifique que la información del perfil es correcta para diferentes roles (admin, profesional, secretaria).
        -   [ ] **Seed**: El `seed` es adecuado para probar este endpoint con diferentes perfiles.

---

## Step 2: User Controller (`user.controller.ts`)

### Análisis

-   **Responsabilidad**: Gestionar sub-usuarios dentro de una cuenta. Permite al administrador crear, listar y actualizar sub-usuarios.
-   **Seguridad**: Todos los endpoints están protegidos por `AuthGuard('jwt')` y `PermissionsGuard`. Se usa el permiso `user:manage:group` para las operaciones de escritura y listado.
-   **Relaciones**:
    -   **User**: Es el módulo principal. Las operaciones se centran en la relación `owner-subUser`.
    -   **Role**: El endpoint de actualización (`PATCH /sub-user/:id`) permite asignar roles a los sub-usuarios.

### Endpoints y Plan de Acción

-   `GET /me`
    -   **Descripción**: Endpoint de conveniencia para obtener el perfil propio. Similar a `/auth/profile` pero con un DTO más simple.
    -   **Checklist**:
        -   [x] **Validación**: Lógica simple y correcta.
        -   [x] **Test**: Test e2e simple para verificar que devuelve el usuario correcto.

-   `POST /sub-user`
    -   **Descripción**: Permite a un admin crear un sub-usuario.
    -   **Checklist**:
        -   [x] **Validación**: El `UserService` contiene la lógica para verificar el límite de usuarios del plan de suscripción. Esto es una validación de negocio crítica y está bien implementada.
        -   [x] **Test**: Crear test e2e para:
            -   Creación exitosa de un sub-usuario por un admin.
            -   Intento de creación por un no-admin (debería fallar con 403).
            -   Intento de creación superando el límite del plan (debería fallar con 400).
        -   [ ] **Seed**: El `seed` ya crea sub-usuarios, pero se puede añadir un caso de prueba para un plan con límite de usuarios bajo para facilitar el testeo.

-   `GET /group`
    -   **Descripción**: Permite a un admin listar todos los usuarios de su grupo.
    -   **Checklist**:
        -   [x] **Validación**: Lógica correcta.
        -   [x] **Test**: Test e2e para verificar que un admin obtiene la lista de sus sub-usuarios y que un no-admin no puede acceder.

-   `PATCH /sub-user/:id`
    -   **Descripción**: Permite a un admin actualizar el nombre, estado y roles de un sub-usuario.
    -   **Checklist**:
        -   [x] **Validación**: La lógica de actualización es correcta y maneja la asignación de roles.
        -   [ ] **Test**: Test e2e para:
            -   Actualizar el `fullName` y `isActive`.
            -   Asignar/cambiar roles a un sub-usuario.
            -   Intentar actualizar un usuario que no pertenece a su grupo (debería fallar con 404).
        -   [ ] **Seed**: El `seed` debe asegurar que existen roles (`Profesional`, `Secretaria`) que puedan ser asignados en los tests.

---

## Step 3: Agenda Controller (`agenda.controller.ts`)

### Análisis

-   **Responsabilidad**: Módulo central para la gestión de citas (turnos), configuración de la agenda, feriados y disponibilidad.
-   **Seguridad**: Protegido con `PermissionsGuard`. Los permisos `agenda:read:own`, `agenda:read:group`, `agenda:write:own` y `agenda:write:group` se usan para controlar el acceso. La lógica de permisos para ver la agenda de otros profesionales parece correcta, validando si el solicitante es admin y si el profesional objetivo pertenece a su grupo.
-   **Relaciones**:
    -   **User**: Cada cita y configuración está asociada a un profesional (User).
    -   **Client**: Las citas pueden tener un cliente asociado.
    -   **Product/Stock**: Se pueden registrar productos usados en una cita, lo que genera movimientos de stock.
-   **Observación**: Hay un endpoint `PATCH /config1` que parece ser de prueba o un duplicado de `updateConfig`. Debería ser eliminado.

### Endpoints y Plan de Acción

-   `POST /`, `PATCH /:id`, `DELETE /:id` (CRUD de Citas)
    -   **Descripción**: Creación, actualización y eliminación (cancelación) de citas.
    -   **Checklist**:
        -   [x] **Validación**: La lógica de transición de estados en el `update` es robusta. El `DELETE` se mapea a una cancelación, lo cual es una buena práctica.
        -   [ ] **Test**: El archivo `agenda.e2e-spec.ts` ya existe. Se debe ampliar para cubrir:
            -   Creación de una cita para otro profesional por un usuario con permiso `agenda:write:group`.
            -   Validación de todas las transiciones de estado posibles (y las inválidas).
            -   Actualización de los detalles de una cita.
        -   [ ] **Seed**: El `seed` ya crea citas.

-   `POST /book`
    -   **Descripción**: Reserva un turno en un slot disponible.
    -   **Checklist**:
        -   [x] **Validación**: La lógica de validación (día laboral, horario, solapamiento) es completa.
        -   [x] **Test**: El test e2e existente cubre varios casos. Se podría añadir un test para el caso de `overbookingAllowed = true`.

-   `GET /available`
    -   **Descripción**: Muestra los slots de tiempo disponibles para un profesional en una fecha dada.
    -   **Checklist**:
        -   [x] **Validación**: La lógica para generar slots y marcar los ocupados es correcta.
        -   [ ] **Test**: Crear test e2e que verifique:
            -   La lista de slots en un día vacío.
            -   Cómo se marcan los slots después de reservar una cita.
            -   Que no se devuelvan slots en días no laborales o feriados.

-   `GET /config`, `PATCH /config1`
    -   **Descripción**: Obtienen y actualizan la configuración de la agenda (horarios, duración de slots, etc.).
    -   **Checklist**:
        -   [x] **Validación**: La lógica es correcta.
        -   [ ] **Acción**: Renombrar `PATCH /config1` a `PATCH /config` y hacerlo funcional. El `console.log` y el tipo `string` en `professionalIdQuery` deben ser corregidos.
        -   [ ] **Test**: Test e2e para obtener y actualizar la configuración de la agenda.

-   `POST /holiday`, `GET /holidays`
    -   **Descripción**: Gestión de feriados para un profesional.
    -   **Checklist**:
        -   [x] **Validación**: Lógica correcta.
        -   [ ] **Test**: Test e2e para añadir un feriado y luego verificar que `GET /available` lo respeta.

-   `GET /summary`, `GET /today`, `GET /week`
    -   **Descripción**: Endpoints de conveniencia para obtener vistas agregadas de la agenda.
    -   **Checklist**:
        -   [x] **Validación**: Lógica correcta.
        -   [ ] **Test**: Crear tests unitarios para el `agenda.service.ts` para estos métodos, ya que testearlos en e2e puede ser complejo por las fechas.

-   `PATCH /:id/products-used`, `GET /:id/products`
    -   **Descripción**: Registra y consulta los productos consumidos en una cita.
    -   **Checklist**:
        -   [x] **Validación**: La lógica de registrar el producto y generar un movimiento de stock es correcta.
        -   [ ] **Test**: Test e2e que:
            1.  Cree una cita.
            2.  Registre productos usados.
            3.  Verifique que el log del producto se creó.
            4.  Verifique que el movimiento de stock se creó en el módulo `stock`.
        -   [ ] **Seed**: El `seed` debe asegurar que hay productos con stock inicial para poder consumirlos.

---

## Step 4: Client, Product, Stock Controllers

### Análisis

-   **Responsabilidad**:
    -   `ClientController`: CRUD de clientes.
    -   `ProductController`: CRUD de productos.
    -   `StockController`: Gestión de movimientos de stock.
-   **Seguridad**: Todos los endpoints están protegidos y usan permisos a nivel de grupo (`canManageClients`, `canManageProducts`). La lógica de permisos para ver/editar recursos de otros usuarios (siendo admin) es consistente en todos ellos.
-   **Relaciones**:
    -   `Client` -> `Appointment` (un cliente tiene muchas citas).
    -   `Product` -> `StockMovement`, `AppointmentProductLog`.
    -   `StockMovement` -> `Product`, `User`.

### Plan de Acción

-   **ClientController**:
    -   **Checklist**:
        -   [x] **Validación**: Lógica CRUD estándar, correcta.
        -   [ ] **Test**: Crear `client.e2e-spec.ts` para probar el CRUD completo, incluyendo los permisos de admin para ver clientes de sub-usuarios.

-   **ProductController**:
    -   **Checklist**:
        -   [x] **Validación**: Lógica CRUD correcta, incluyendo el historial de precios.
        -   [ ] **Test**: Crear `product.e2e-spec.ts` para probar el CRUD, la actualización de precios y el cambio de estado.

-   **StockController**:
    -   **Checklist**:
        -   [x] **Validación**: La lógica de creación de movimientos y el resumen de stock es correcta.
        -   [ ] **Test**: Crear `stock.e2e-spec.ts` para:
            -   Registrar un movimiento de entrada (`in`).
            -   Verificar que el `GET /:productId/summary` refleja el nuevo stock.
            -   Probar la relación con `agenda` (el test de `agenda` ya cubriría el movimiento de `usage`).

---

## Step 5: Roles & Permissions Controller (`roles.controller.ts`)

### Análisis

-   **Responsabilidad**: CRUD para Roles y sus asignaciones de Permisos.
-   **Seguridad**: Protegido por el permiso `role:manage`. Esto es correcto, ya que la gestión de roles es una tarea administrativa de alto nivel.
-   **Relaciones**:
    -   `Role` <-> `Permission` (Muchos a Muchos).
    -   `Role` <-> `User` (Muchos a Muchos).

### Plan de Acción

-   **Checklist**:
    -   [x] **Validación**: La lógica del servicio para crear, actualizar (incluyendo la asignación de permisos) y eliminar roles es robusta.
    -   [ ] **Test**: Crear `roles.e2e-spec.ts` para:
        -   Crear un nuevo rol sin permisos.
        -   Crear un nuevo rol con permisos.
        -   Actualizar un rol para añadir/quitar permisos.
        -   Intentar crear un rol con un nombre duplicado (debe fallar).
        -   Eliminar un rol.
    -   [ ] **Seed**: El `seed` ya crea los permisos y roles necesarios, sirviendo como una excelente base para los tests.

---

## Step 6: Otros Controladores (Notification, Subscription, etc.)

### Análisis

-   **NotificationController**: Lógica simple para notificaciones internas.
-   **SubscriptionPlanController**: CRUD para los planes de suscripción. Parece ser un controlador de administración interna, no para el cliente final.
-   **SubscriptionController**: Expone los planes disponibles.

### Plan de Acción

-   **Checklist**:
    -   [x] **Validación**: La lógica de estos controladores es simple y parece correcta.
    -   [ ] **Test**: Se pueden crear tests e2e básicos para estos controladores para asegurar que las rutas funcionan y devuelven los datos esperados. La prioridad de testeo es menor que la de los módulos de negocio principales.
    -   [ ] **ReminderService**: El `ReminderService` que usa `cron` es difícil de probar con e2e. Se debe crear un test unitario (`reminder.service.spec.ts`) que mockee los repositorios y el `notificationService` para verificar que la lógica de búsqueda de citas y envío de notificaciones es correcta.

---

## Resumen del Plan de Trabajo

1.  **Refactorización Menor**:
    -   [ ] Corregir/eliminar el endpoint `PATCH /agenda/config1`.
2.  **Creación de Archivos de Test E2E**:
    -   [ ] `client.e2e-spec.ts`
    -   [ ] `product.e2e-spec.ts`
    -   [ ] `stock.e2e-spec.ts`
    -   [ ] `roles.e2e-spec.ts`
    -   [ ] `notification.e2e-spec.ts` (opcional, baja prioridad)
3.  **Ampliación de Tests Existentes**:
    -   [ ] Ampliar `agenda.e2e-spec.ts` para cubrir todos los casos de uso y permisos.
    -   [ ] Crear tests e2e para `auth.controller.ts` y `user.controller.ts`.
4.  **Creación de Tests Unitarios**:
    -   [ ] `reminder.service.spec.ts`
    -   [ ] `agenda.service.spec.ts` (para métodos de resumen).
5.  **Actualización del Seed**:
    -   [ ] Considerar añadir un plan de suscripción con un límite de usuarios bajo (ej. 2) para facilitar las pruebas de la lógica de creación de sub-usuarios.
    -   [ ] Asegurar que el `seed` crea productos con stock inicial a través de un movimiento `in`.
