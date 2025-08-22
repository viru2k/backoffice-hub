# Sistema de Recompensas - Especificación Frontend

## Resumen
Sistema de recompensas configurable asociado a clientes que permite crear programas personalizados por tipo de negocio con seguimiento automático del progreso del cliente.

## Entidades del Backend

### RewardProgram (Programas de Recompensas)
```typescript
{
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
  additionalConditions?: Record<string, any>;
}
```

### CustomerReward (Recompensas por Cliente)
```typescript
{
  id: number;
  currentProgress: number;
  targetValue: number;
  status: 'IN_PROGRESS' | 'EARNED' | 'REDEEMED' | 'EXPIRED';
  earnedAt?: Date;
  redeemedAt?: Date;
  expiresAt?: Date;
  timesUsed: number;
  client: Client;
  rewardProgram: RewardProgram;
  metadata?: Record<string, any>;
}
```

## Interfaces Requeridas

### 1. Gestión de Programas de Recompensas
**Ruta sugerida:** `/rewards/programs`

#### Listado de Programas
- Tabla con programas existentes
- Filtros: tipo de negocio, estado, tipo de condición
- Acciones: crear, editar, activar/desactivar, eliminar

#### Crear/Editar Programa
- **Información Básica:**
  - Nombre del programa (requerido)
  - Descripción (opcional)
  - Tipo de negocio (selector)
  - Estado (activo/inactivo/borrador)

- **Condiciones:**
  - Tipo de condición (dropdown):
    - `VISIT_COUNT`: "Número de visitas/citas"
    - `PURCHASE_AMOUNT`: "Monto de compra"
    - `SERVICE_COUNT`: "Cantidad de servicios"
    - `CONSULTATION_COUNT`: "Número de consultas"
  - Valor de la condición (número)

- **Recompensa:**
  - Tipo de recompensa (dropdown):
    - `DISCOUNT_PERCENTAGE`: "Descuento porcentual"
    - `DISCOUNT_AMOUNT`: "Descuento fijo"
    - `FREE_SERVICE`: "Servicio gratuito"
    - `POINTS`: "Puntos"
  - Valor de la recompensa (número)

- **Configuración Avanzada:**
  - Máximo usos por cliente
  - Fecha de inicio (opcional)
  - Fecha de fin (opcional)

#### Ejemplos de Programas
- "Fidelidad Belleza": 5 servicios → servicio gratis
- "Cliente VIP": Compra >$100 → 10% descuento
- "Paciente Regular": 3 consultas → 15% descuento próxima cita

### 2. Vista de Cliente con Recompensas
**Integrar en:** Perfil del cliente existente

#### Panel de Recompensas del Cliente
- **Recompensas Activas (En Progreso):**
  - Nombre del programa
  - Progreso visual (barra de progreso)
  - "X de Y completado"
  - Tiempo restante si aplica

- **Recompensas Disponibles (Ganadas):**
  - Listado de recompensas listas para canjear
  - Fecha de expiración
  - Botón "Canjear"

- **Historial:**
  - Recompensas canjeadas con fechas
  - Recompensas expiradas

### 3. Dashboard de Recompensas
**Ruta sugerida:** `/rewards/dashboard`

#### Métricas Generales
- Total programas activos
- Total clientes con recompensas activas
- Recompensas canjeadas este mes
- Programas más populares

#### Gráficos
- Participación por programa
- Recompensas por período
- Distribución por tipo de negocio

### 4. Proceso de Canje
#### Modal de Canje
- Confirmación de canje de recompensa
- Detalles de la recompensa
- Aplicación automática en siguiente factura/cita

## APIs Implementadas y Validadas ✅

### Gestión de Programas
```bash
GET /rewards/programs - Listar todos los programas ✅
POST /rewards/programs - Crear nuevo programa ✅  
GET /rewards/programs/active - Solo programas activos ✅
GET /rewards/programs/business-type/:id - Por tipo de negocio ✅
PATCH /rewards/programs/:id - Actualizar programa ✅
DELETE /rewards/programs/:id - Eliminar programa ✅
```

### Recompensas de Cliente (Validadas con Datos Reales)
```bash
GET /rewards/customer/:clientId - Todas las recompensas ✅
GET /rewards/customer/:clientId/active - En progreso ✅
GET /rewards/customer/:clientId/earned - Listas para canjear ✅
GET /rewards/customer/:clientId/history - Historial completo ✅
POST /rewards/customer/:clientId/redeem/:rewardId - Canjear ✅
```

### Triggers Automáticos (Integración Validada)
```bash
POST /rewards/trigger/appointment-completed/:clientId ✅
POST /rewards/trigger/consultation-completed/:clientId ✅
POST /rewards/trigger/service-completed/:clientId ✅
POST /rewards/trigger/purchase-completed/:clientId ✅
```

### Analytics y Mantenimiento
```bash
GET /rewards/metrics - Métricas del sistema ✅
POST /rewards/cleanup/expired - Limpiar expiradas ✅
```

## Ejemplos de Respuestas Reales (Validadas)

### Cliente con Recompensas Activas
```json
[
  {
    "id": 1,
    "currentProgress": "3.00",
    "targetValue": "5.00", 
    "status": "IN_PROGRESS",
    "rewardProgram": {
      "name": "Cliente Fiel",
      "description": "Programa de fidelidad general",
      "conditionType": "VISIT_COUNT",
      "rewardType": "DISCOUNT_PERCENTAGE", 
      "rewardValue": "10.00"
    }
  }
]
```

### Métricas del Sistema
```json
{
  "totalActivePrograms": 5,
  "totalActiveRewards": 3,
  "totalEarnedRewards": 0,
  "totalRedeemedRewards": 2
}
```

## Consideraciones de UX

1. **Feedback Visual:**
   - Barras de progreso para recompensas activas
   - Badges/notificaciones para recompensas disponibles
   - Iconos distintivos por tipo de recompensa

2. **Gamificación:**
   - Celebración visual al completar recompensa
   - Indicadores de progreso llamativos
   - Notificaciones push cuando se gana una recompensa

3. **Facilidad de Configuración:**
   - Templates pre-configurados por tipo de negocio
   - Wizard paso a paso para crear programas
   - Preview de cómo se verá para el cliente

4. **Integración:**
   - Mostrar recompensas disponibles en checkout/facturación
   - Aplicación automática de descuentos
   - Notificaciones en calendario de citas

## Estados de Loading y Error

- Loading states para todas las operaciones CRUD
- Mensajes de error específicos por operación
- Confirmaciones antes de eliminar programas
- Validaciones en tiempo real en formularios

## Responsive Design

- Adaptación mobile para vista de cliente
- Dashboard optimizado para tablet/desktop
- Formularios responsive para configuración

## Notas Técnicas

- El sistema se integra con las entidades existentes: `Client`, `BusinessType`
- Las recompensas se actualizan automáticamente con eventos del backend
- **WebSockets implementados y funcionales** para notificaciones en tiempo real ✅
- Cachear datos de programas activos para mejor performance

## 🔔 Sistema de Notificaciones Push (Implementado)

### Configuración WebSocket
```typescript
// Hook para notificaciones de recompensas
const useRewardsNotifications = () => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const socketInstance = io('http://localhost:3000/notifications', {
      auth: { token: getAuthToken() },
      transports: ['websocket']
    });

    // Notificaciones específicas de recompensas
    socketInstance.on('notification', (notification) => {
      switch(notification.type) {
        case 'reward_earned':
          showSuccess('🎁 ¡Recompensa ganada!', notification.message);
          // Actualizar estado de recompensas
          refreshRewards();
          break;
        case 'reward_progress_updated':
          showInfo('📈 Progreso actualizado', notification.message);
          break;
        case 'reward_about_to_expire':
          showWarning('⏰ Recompensa por expirar', notification.message);
          break;
      }
    });

    setSocket(socketInstance);
    return () => socketInstance.disconnect();
  }, []);

  return socket;
};
```

### Endpoints de Notificaciones
```bash
GET /notifications - Todas las notificaciones ✅
GET /notifications/unread - No leídas ✅ 
GET /notifications/summary - Resumen dashboard ✅
POST /notifications/test-websocket - Prueba tiempo real ✅
GET /notifications/websocket-stats - Stats conexiones ✅
```

### Componente de Notificaciones para Recompensas
```typescript
const RewardsNotificationCenter: React.FC = () => {
  const socket = useRewardsNotifications();
  const [notifications, setNotifications] = useState([]);

  const markAsRead = async (notificationId: number) => {
    await fetch(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
  };

  return (
    <div className="rewards-notifications">
      <div className="notification-bell">
        🔔 {notifications.filter(n => !n.read).length}
      </div>
      
      <div className="notifications-dropdown">
        {notifications.map(notification => (
          <div 
            key={notification.id}
            className={`notification-item ${notification.read ? 'read' : 'unread'}`}
            onClick={() => markAsRead(notification.id)}
          >
            <div className="notification-content">
              <h4>{notification.title}</h4>
              <p>{notification.message}</p>
              <span className="timestamp">
                {formatDate(notification.createdAt)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```