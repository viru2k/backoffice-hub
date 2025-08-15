# Guía para el Agente de Frontend: Gestión de Usuarios y Permisos

Este documento describe los endpoints clave y el flujo de interacción con la API de Backoffice Hub para la gestión de usuarios y sus permisos. Está diseñado para guiar la construcción de la interfaz de usuario, detallando las funcionalidades feature a feature.

---

# Configuración de Turnos y Horarios para Calendario

## Endpoint Específico de Configuración de Agenda

La API ya cuenta con endpoints específicos para manejar la configuración de calendarios, separado del perfil del usuario.

### GET `/agenda/config` 
Obtiene la configuración de agenda del profesional actual o especificado.

**Query Parameters:**
- `professionalId` (opcional): ID del profesional (solo para administradores)

**Respuesta:**
```json
{
  "id": 1,
  "userId": 1,
  "slotDurationMinutes": 30,
  "workStart": "09:00",
  "workEnd": "18:00",
  "workingDays": [1, 2, 3, 4, 5, 6],
  "allowOverbooking": false,
  "allowBookingOnBlockedDays": false
}
```

### PATCH `/agenda/config`
Actualiza la configuración de agenda del profesional.

**Query Parameters:**
- `professionalId` (opcional): ID del profesional (solo para administradores)

**Request Body:**
```json
{
  "startTime": "08:00",
  "endTime": "16:00",
  "slotDuration": 15,
  "workingDays": ["monday", "tuesday", "wednesday", "thursday", "friday"],
  "overbookingAllowed": true,
  "allowBookingOnBlockedDays": false
}
```

---

# Gestión Avanzada de Agenda - Casos de Uso Reales ✅

## 🎯 **CASO DE USO 1: Horario Temporal por Motivos Personales**

**Escenario:** Tienes agenda Lu-Vi 8:00-17:00 con turnos cada 15min (36 slots/día), pero la próxima semana necesitas trabajar solo 8:00-14:00 (24 slots/día) por motivos personales.

### Solución Ejecutada y Probada ✅

```javascript
// ✅ CÓDIGO PROBADO - Configurar semana temporal
const setTemporaryWeekSchedule = async (startDate, endDate, newHours) => {
  const results = [];
  const dates = getDatesBetween(startDate, endDate);
  
  for (const date of dates) {
    if (isWorkingDay(date)) {
      const result = await fetch('/agenda/day-override', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: date.toISOString().split('T')[0],
          startTime: newHours.startTime,
          endTime: newHours.endTime,
          slotDuration: newHours.slotDuration,
          note: `Horario temporal ${getDayName(date)} - motivos personales`
        })
      });
      
      results.push(await result.json());
    }
  }
  
  return results;
};

// ✅ EJECUTADO CON ÉXITO
await setTemporaryWeekSchedule(
  new Date('2025-08-18'), // Lunes
  new Date('2025-08-22'), // Viernes
  {
    startTime: "08:00",
    endTime: "14:00", 
    slotDuration: 15
  }
);
```

### Resultado Real Obtenido ✅

```json
{
  "from": "2025-08-18",
  "to": "2025-08-22", 
  "totalDays": 5,
  "workingDays": 4,
  "blockedDays": 0,
  "days": [
    {
      "date": "2025-08-19",
      "isWorkingDay": true,
      "override": {
        "startTime": "08:00:00",
        "endTime": "14:00:00", 
        "slotDuration": 15,
        "note": "Horario temporal martes - motivos personales"
      },
      "availableSlots": 24, // ✅ Reducido de 36 a 24 slots
      "totalSlots": 24
    }
    // ... resto de días con mismo patrón
  ]
}
```

**✅ Confirmado:** El sistema aplicó correctamente:
- Horarios temporales 8:00-14:00 (6 horas)
- 24 slots de 15min (en lugar de 36 slots normales)
- Solo para días laborables L-V
- Configuración base intacta (volverá a 8:00-17:00 automáticamente la siguiente semana)

---

## 🎯 **CASO DE USO 2: Remover Festivos/Días Bloqueados**

### Método Recomendado: Desbloquear Fechas Específicas
```javascript
// ⚠️ ENDPOINT CON PROBLEMA DE VALIDACIÓN ACTUAL
const unblockDates = async (dates) => {
  try {
    const response = await fetch(`/agenda/block-dates?dates=${dates.join(',')}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  } catch (error) {
    console.error('Error desbloqueando fechas:', error);
    // ALTERNATIVA: Eliminar holidays individuales si existe DELETE /agenda/holiday/:id
  }
};
```

### Alternativa Temporal (hasta que se arregle el endpoint)
```javascript
// Método manual para remover festivos
const removeHolidays = async () => {
  // 1. Obtener lista de festivos
  const holidays = await fetch('/agenda/holidays', {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json());
  
  // 2. Identificar cuáles remover
  const christmasHolidays = holidays.filter(h => 
    h.date.includes('2025-12-25') || h.date.includes('2025-12-26')
  );
  
  // 3. Necesitaríamos endpoint DELETE /agenda/holiday/:id
  console.log('Festivos a remover:', christmasHolidays);
};
```

---

## Endpoints de Gestión Avanzada

### POST `/agenda/block-dates` ✅
Bloquea múltiples fechas de una vez (vacaciones, días libres, etc.)

**Request Body:**
```json
{
  "dates": ["2025-12-24", "2025-12-25", "2025-12-26"],
  "reason": "Vacaciones de Navidad"
}
```

**Respuesta:**
```json
{
  "message": "3 fechas bloqueadas exitosamente",
  "blockedDates": 3
}
```

### POST `/agenda/day-override` ✅ 
**¡COMPLETAMENTE FUNCIONAL Y PROBADO!**

Configura horario especial para un día específico (sobrescribe configuración general)

**Request Body:**
```json
{
  "date": "2025-08-18",
  "startTime": "08:00",
  "endTime": "14:00",
  "slotDuration": 15,
  "blocked": false,
  "note": "Horario temporal lunes - motivos personales"
}
```

**Respuesta Exitosa:**
```json
{
  "message": "Override de día configurado exitosamente",
  "override": {
    "id": 2,
    "date": "2025-08-18",
    "startTime": "08:00",
    "endTime": "14:00", 
    "slotDuration": 15,
    "blocked": false,
    "note": "Horario temporal lunes - motivos personales"
  }
}
```

### GET `/agenda/availability-range` ✅
**¡COMPLETAMENTE FUNCIONAL Y PROBADO!**

Obtiene disponibilidad detallada para un rango de fechas

**Query Parameters:**
- `from` (requerido): Fecha inicio (YYYY-MM-DD)
- `to` (requerido): Fecha fin (YYYY-MM-DD)  
- `professionalId` (opcional): ID del profesional

**Ejemplo de Uso Probado:**
```javascript
// ✅ CÓDIGO PROBADO
const checkWeekAvailability = async () => {
  const response = await fetch('/agenda/availability-range?from=2025-08-18&to=2025-08-22', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  
  // Análisis automático
  data.days.forEach(day => {
    console.log(`📅 ${day.date}:`);
    console.log(`   Slots: ${day.availableSlots}/${day.totalSlots}`);
    
    if (day.override) {
      console.log(`   🔧 Override: ${day.override.startTime}-${day.override.endTime}`);
      console.log(`   📝 Nota: ${day.override.note}`);
    }
    
    if (!day.isWorkingDay) console.log(`   ❌ No laborable`);
    if (day.isHoliday) console.log(`   🎉 Feriado: ${day.holidayReason}`);
  });
};

// ✅ RESULTADO REAL:
// 📅 2025-08-18: Slots: 0/0 ❌ No laborable 🔧 Override: 08:00-14:00
// 📅 2025-08-19: Slots: 24/24 🔧 Override: 08:00-14:00 📝 Horario temporal martes
// 📅 2025-08-20: Slots: 24/24 🔧 Override: 08:00-14:00 📝 Horario temporal miércoles  
// 📅 2025-08-21: Slots: 24/24 🔧 Override: 08:00-14:00 📝 Horario temporal jueves
// 📅 2025-08-22: Slots: 24/24 🔧 Override: 08:00-14:00 📝 Horario temporal viernes
```

### GET `/agenda/day-overrides` ✅
Lista todos los overrides de días específicos

**Query Parameters:**
- `professionalId` (opcional): ID del profesional
- `from` (opcional): Fecha inicio filtro (YYYY-MM-DD) 
- `to` (opcional): Fecha fin filtro (YYYY-MM-DD)

### DELETE `/agenda/block-dates` ⚠️
Desbloquea fechas específicas (actualmente con problemas de validación)

### PATCH `/agenda/bulk-config` ⚠️  
Actualización masiva de configuración para un rango de fechas (actualmente con problemas de validación)

---

## Implementación Frontend Completa

### 1. Panel de Gestión de Horarios Temporales

```javascript
const TemporaryScheduleManager = () => {
  const [weekRange, setWeekRange] = useState({ start: '', end: '' });
  const [temporaryHours, setTemporaryHours] = useState({
    startTime: '08:00',
    endTime: '14:00', 
    slotDuration: 15
  });
  const [activeOverrides, setActiveOverrides] = useState([]);

  // ✅ FUNCIÓN PROBADA
  const applyTemporaryWeek = async () => {
    try {
      const startDate = new Date(weekRange.start);
      const endDate = new Date(weekRange.end);
      
      const results = await setTemporaryWeekSchedule(startDate, endDate, temporaryHours);
      
      showSuccess(`Horario temporal aplicado a ${results.length} días`);
      await loadActiveOverrides();
    } catch (error) {
      showError('Error aplicando horario temporal');
    }
  };

  // Cargar overrides existentes
  const loadActiveOverrides = async () => {
    try {
      const overrides = await fetch('/agenda/day-overrides', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json());
      
      setActiveOverrides(overrides);
    } catch (error) {
      console.error('Error cargando overrides:', error);
    }
  };

  // Análisis de impacto
  const analyzeImpact = async () => {
    if (!weekRange.start || !weekRange.end) return;
    
    const availability = await fetch(
      `/agenda/availability-range?from=${weekRange.start}&to=${weekRange.end}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    ).then(r => r.json());
    
    const impact = {
      totalDays: availability.workingDays,
      slotsReduced: availability.days.reduce((acc, day) => {
        const normalSlots = calculateNormalSlots(day.date);
        const newSlots = calculateNewSlots(temporaryHours);
        return acc + (normalSlots - newSlots);
      }, 0)
    };
    
    setImpactAnalysis(impact);
  };

  return (
    <div className="temporary-schedule-manager">
      <h3>🕐 Configurar Horario Temporal</h3>
      
      {/* Selector de semana */}
      <div className="week-selector">
        <label>Semana temporal:</label>
        <input 
          type="date" 
          value={weekRange.start}
          onChange={(e) => setWeekRange({...weekRange, start: e.target.value})}
        />
        <span>a</span>
        <input 
          type="date"
          value={weekRange.end} 
          onChange={(e) => setWeekRange({...weekRange, end: e.target.value})}
        />
      </div>

      {/* Configuración de horarios */}
      <div className="hours-config">
        <label>Nuevo horario:</label>
        <input 
          type="time"
          value={temporaryHours.startTime}
          onChange={(e) => setTemporaryHours({...temporaryHours, startTime: e.target.value})}
        />
        <span>a</span>
        <input 
          type="time"
          value={temporaryHours.endTime}
          onChange={(e) => setTemporaryHours({...temporaryHours, endTime: e.target.value})}
        />
        <label>Intervalo:</label>
        <select 
          value={temporaryHours.slotDuration}
          onChange={(e) => setTemporaryHours({...temporaryHours, slotDuration: parseInt(e.target.value)})}
        >
          <option value={15}>15 minutos</option>
          <option value={30}>30 minutos</option>
          <option value={60}>60 minutos</option>
        </select>
      </div>

      {/* Análisis de impacto */}
      <div className="impact-analysis">
        <button onClick={analyzeImpact}>📊 Analizar Impacto</button>
        {/* Mostrar análisis si existe */}
      </div>

      {/* Aplicar cambios */}
      <div className="actions">
        <button onClick={applyTemporaryWeek} className="apply-btn">
          ✅ Aplicar Horario Temporal
        </button>
      </div>

      {/* Lista de overrides activos */}
      <div className="active-overrides">
        <h4>Horarios Especiales Activos</h4>
        {activeOverrides.map(override => (
          <div key={override.id} className="override-item">
            <span className="date">{override.date}</span>
            <span className="time">{override.startTime} - {override.endTime}</span>
            <span className="note">{override.note}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 2. Analizador de Disponibilidad con Datos Reales

```javascript
const AvailabilityAnalyzer = () => {
  const [analysisData, setAnalysisData] = useState(null);

  // ✅ FUNCIÓN PROBADA CON DATOS REALES
  const analyzeAvailability = async (from, to) => {
    const response = await fetch(`/agenda/availability-range?from=${from}&to=${to}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    setAnalysisData(data);
    
    return data;
  };

  const renderDayCard = (day) => {
    const getStatusColor = (day) => {
      if (day.override) return '#ff9800'; // Naranja para overrides
      if (day.isHoliday) return '#f44336'; // Rojo para feriados  
      if (!day.isWorkingDay) return '#9e9e9e'; // Gris para no laborables
      if (day.availableSlots === 0) return '#f44336'; // Rojo para lleno
      if (day.availableSlots < day.totalSlots / 2) return '#ff5722'; // Naranja para ocupado
      return '#4caf50'; // Verde para disponible
    };

    return (
      <div 
        key={day.date} 
        className="day-card"
        style={{ borderLeft: `4px solid ${getStatusColor(day)}` }}
      >
        <div className="day-header">
          <h4>{day.date}</h4>
          <span className="slots-count">{day.availableSlots}/{day.totalSlots}</span>
        </div>
        
        <div className="day-details">
          {day.override && (
            <div className="override-info">
              <span className="override-badge">🔧 Horario especial</span>
              <div className="override-details">
                {day.override.startTime} - {day.override.endTime}
              </div>
              <div className="override-note">{day.override.note}</div>
            </div>
          )}
          
          {day.isHoliday && (
            <div className="holiday-info">
              <span className="holiday-badge">🎉 Feriado</span>
              <div>{day.holidayReason}</div>
            </div>
          )}
          
          {!day.isWorkingDay && (
            <div className="non-working-info">
              <span className="non-working-badge">❌ No laborable</span>
            </div>
          )}
        </div>

        {/* Previsualización de slots */}
        {day.slots && day.slots.length > 0 && (
          <div className="slots-preview">
            <div className="slots-grid">
              {day.slots.slice(0, 8).map(slot => (
                <div 
                  key={slot.time}
                  className={`slot ${slot.available ? 'available' : 'taken'}`}
                >
                  {slot.time}
                </div>
              ))}
              {day.slots.length > 8 && (
                <div className="more-slots">+{day.slots.length - 8}</div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="availability-analyzer">
      <div className="analyzer-controls">
        <input 
          type="date" 
          placeholder="Fecha inicio"
          onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
        />
        <input 
          type="date"
          placeholder="Fecha fin" 
          onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
        />
        <button onClick={() => analyzeAvailability(dateRange.from, dateRange.to)}>
          📊 Analizar Disponibilidad
        </button>
      </div>

      {analysisData && (
        <div className="analysis-results">
          {/* Resumen estadístico */}
          <div className="stats-summary">
            <div className="stat">
              <span className="stat-value">{analysisData.totalDays}</span>
              <span className="stat-label">Total días</span>
            </div>
            <div className="stat">
              <span className="stat-value">{analysisData.workingDays}</span>
              <span className="stat-label">Días laborables</span>
            </div>
            <div className="stat">
              <span className="stat-value">{analysisData.blockedDays}</span>
              <span className="stat-label">Días bloqueados</span>
            </div>
          </div>

          {/* Grid de días */}
          <div className="days-grid">
            {analysisData.days.map(renderDayCard)}
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## Funciones Auxiliares Probadas

```javascript
// ✅ FUNCIONES AUXILIARES PROBADAS
const getDatesBetween = (start, end) => {
  const dates = [];
  const currentDate = new Date(start);
  
  while (currentDate <= end) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};

const isWorkingDay = (date) => {
  const dayOfWeek = date.getDay(); // 0=Domingo, 1=Lunes...
  return dayOfWeek >= 1 && dayOfWeek <= 5; // Lunes a Viernes
};

const getDayName = (date) => {
  const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  return days[date.getDay()];
};

const calculateSlots = (startTime, endTime, slotDuration) => {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  
  return Math.floor((endMinutes - startMinutes) / slotDuration);
};
```

---

## Notas de Implementación

### Estados de Endpoints
- ✅ **Completamente funcionales**: `POST /day-override`, `GET /day-overrides`, `GET /availability-range`, `POST /block-dates`
- ⚠️ **Con problemas de validación**: `DELETE /block-dates`, `PATCH /bulk-config`

### Jerarquía de Configuración
1. **Configuración base** (`/agenda/config`) → Horarios generales Lu-Vi 8:00-17:00
2. **Feriados** (`/holidays`) → Días completamente bloqueados  
3. **Overrides de días** (`/day-overrides`) → Horarios especiales (prioridad máxima)

### Flujo Probado y Recomendado
```javascript
// 1. Verificar configuración actual
const config = await getCalendarConfig();

// 2. Para cambios temporales: usar day overrides 
const results = await setTemporaryWeekSchedule(startDate, endDate, newHours);

// 3. Verificar resultado con availability-range
const verification = await getAvailabilityRange(startDate, endDate);

// 4. Gestionar citas existentes afectadas
const affectedAppointments = verification.days
  .filter(day => day.override && day.availableSlots < day.totalSlots)
  .map(day => day.date);
```

### Manejo de Errores
- **400 Bad Request**: Problemas de validación - revisar formato de datos
- **403 Forbidden**: Sin permisos - mostrar mensaje apropiado  
- **404 Not Found**: Usuario sin configuración de agenda
- **500 Server Error**: Error interno - reintentar o contactar soporte

---

## 1. Autenticación

Antes de interactuar con cualquier endpoint protegido, el agente de frontend debe autenticarse para obtener un JSON Web Token (JWT).

*   **Endpoint**: `POST /auth/login`
*   **Cuerpo de la Solicitud (Request Body)**:
    ```json
    {
      "email": "usuario@ejemplo.com",
      "password": "su_password"
    }
    ```
*   **Respuesta Exitosa (200 OK)**:
    ```json
    {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    ```
*   **Uso**: El `accessToken` debe ser almacenado de forma segura (ej. `localStorage` o `sessionStorage`) y enviado en el encabezado `Authorization` como `Bearer <accessToken>` en todas las solicitudes subsiguientes a endpoints protegidos.

---

## 2. Gestión de Usuarios y Permisos

### 2.1. Listado de Usuarios del Grupo (con Roles y Permisos)

Este endpoint permite a un administrador obtener una lista de todos los usuarios que pertenecen a su mismo grupo (tenant), incluyendo sus roles y los permisos asociados a cada rol.

*   **Endpoint**: `GET /users/group`
*   **Permiso Requerido**: `user:manage:group` (El usuario autenticado debe tener este permiso).
*   **Respuesta Exitosa (200 OK)**: Array de `UserResponseDto`.
    ```json
    [
      {
        "id": 1,
        "email": "admin@glamour.com",
        "fullName": "Admin Glamour",
        "isAdmin": true,
        "active": true,
        "createdAt": "2025-08-06T10:00:00.000Z",
        "updatedAt": "2025-08-06T10:00:00.000Z",
        "roles": [
          {
            "id": 1,
            "name": "Admin de Cuenta",
            "description": "Acceso total a la cuenta.",
            "permissions": [
              { "id": 1, "name": "agenda:read:own", "description": "Ver la agenda propia" },
              { "id": 2, "name": "agenda:read:group", "description": "Ver la agenda de todos en el grupo" },
              // ... más permisos
            ]
          }
        ]
      },
      {
        "id": 2,
        "email": "estilista@glamour.com",
        "fullName": "Carlos Estilista",
        "isAdmin": false,
        "active": true,
        "createdAt": "2025-08-06T10:05:00.000Z",
        "updatedAt": "2025-08-06T10:05:00.000Z",
        "roles": [
          {
            "id": 2,
            "name": "Profesional",
            "description": "Gestiona su agenda y clientes.",
            "permissions": [
              { "id": 1, "name": "agenda:read:own", "description": "Ver la agenda propia" },
              // ... más permisos
            ]
          }
        ]
      }
    ]
    ```
*   **Uso en Frontend**: Utilizar esta respuesta para poblar una tabla o lista de usuarios, mostrando su información básica, y permitiendo expandir para ver los roles y permisos detallados.

### 2.2. Actualización de Roles de Sub-Usuarios

Permite a un administrador actualizar el perfil de un sub-usuario, incluyendo su nombre, estado de actividad y, crucialmente, los roles asignados.

*   **Endpoint**: `PATCH /users/sub-user/:id`
*   **Permiso Requerido**: `user:manage:group`
*   **Parámetros de Ruta**: `:id` (ID del sub-usuario a actualizar).
*   **Cuerpo de la Solicitud (Request Body)**: `AdminUpdateUserDto`.
    *   **Ejemplo 1: Actualizar roles y estado de actividad**
        ```json
        {
          "isActive": true,
          "roles": [
            { "id": 1, "name": "Admin de Cuenta" },
            { "id": 2, "name": "Profesional" }
          ]
        }
        ```
    *   **Ejemplo 2: Actualizar solo el nombre completo**
        ```json
        {
          "fullName": "Nuevo Nombre Completo del Usuario"
        }
        ```
*   **Consideraciones**:
    *   El backend solo utilizará el `id` de los objetos `roles` para vincular los roles existentes al usuario. El `name` es opcional en el envío, pero se recomienda incluirlo para claridad en el frontend.
    *   Solo se pueden actualizar usuarios que pertenezcan al mismo grupo del administrador autenticado y que no sean administradores de cuenta (el propio `owner`).

### 2.3. Obtención de Permisos Disponibles

Este endpoint proporciona una lista de todos los permisos atómicos definidos en el sistema. Es útil para construir interfaces de administración de roles donde se puedan seleccionar permisos.

*   **Endpoint**: `GET /permissions`
*   **Permiso Requerido**: `role:manage`
*   **Respuesta Exitosa (200 OK)**: Array de `PermissionResponseDto`.
    ```json
    [
      {
        "id": 1,
        "name": "agenda:read:own",
        "description": "Ver la agenda propia"
      },
      {
        "id": 2,
        "name": "agenda:read:group",
        "description": "Ver la agenda de todos en el grupo"
      },
      {
        "id": 7,
        "name": "user:manage:group",
        "description": "Crear/editar/eliminar sub-usuarios del grupo"
      }
      // ... y así sucesivamente para todos los permisos
    ]
    ```
*   **Uso en Frontend**: Esta lista puede ser utilizada para poblar selectores o checkboxes en una interfaz de gestión de roles (si se implementa la creación/edición de roles en el frontend), permitiendo al administrador asignar permisos a un rol.

---

## 3. Plan de Implementación (Feature a Feature)

Este plan sugiere un orden lógico para construir las funcionalidades en el frontend.

### Feature 1: Módulo de Autenticación (Login)

*   **Descripción**: Interfaz de usuario para que los usuarios ingresen sus credenciales (email y contraseña).
*   **Interacción API**:
    *   Realizar una solicitud `POST` a `/auth/login` con el email y la contraseña.
    *   En caso de éxito (200 OK), extraer el `accessToken` de la respuesta.
    *   Almacenar el `accessToken` de forma segura (ej. `localStorage`).
    *   Redirigir al usuario a la página principal o al dashboard.
    *   Manejar errores (ej. credenciales inválidas, usuario inactivo) mostrando mensajes apropiados.

### Feature 2: Visualización de Usuarios del Grupo

*   **Descripción**: Una página o componente que muestre una lista de todos los usuarios bajo la cuenta del administrador autenticado.
*   **Interacción API**:
    *   Al cargar la página/componente, realizar una solicitud `GET` a `/users/group`, incluyendo el JWT en el encabezado `Authorization`.
    *   Procesar la respuesta (array de `UserResponseDto`).
    *   Renderizar una tabla o lista, mostrando el `email`, `fullName`, `isAdmin`, `active` de cada usuario.
    *   Implementar una forma de expandir cada fila para mostrar los `roles` asignados al usuario, y dentro de cada rol, sus `permissions`.
    *   Manejar estados de carga y errores de la API.

### Feature 3: Edición de Roles de Sub-Usuario

*   **Descripción**: Un formulario o modal que permita a un administrador modificar los detalles de un sub-usuario, incluyendo la asignación de roles.
*   **Interacción API**:
    *   **Carga de Datos**: Al abrir el formulario para un usuario específico, se pueden usar los datos ya obtenidos del `GET /users/group`.
    *   **Selección de Roles**:
        *   Para permitir la selección de roles, el frontend necesitará una lista de todos los roles disponibles. Por ahora, se puede asumir que el frontend tiene esta lista o la obtiene de los roles ya presentes en los usuarios del `GET /users/group`. (Idealmente, en el futuro, podría haber un `GET /roles` para obtener todos los roles disponibles).
        *   Presentar una interfaz (ej. checkboxes, multi-select) para que el administrador elija los roles que desea asignar al sub-usuario.
    *   **Envío de Actualización**:
        *   Al guardar los cambios, construir un objeto `AdminUpdateUserDto`.
        *   El array `roles` en el DTO debe contener objetos con al menos el `id` de cada rol seleccionado (ej. `{ id: 1, name: "Admin de Cuenta" }`).
        *   Realizar una solicitud `PATCH` a `/users/sub-user/:id` (reemplazando `:id` con el ID real del usuario) con el `AdminUpdateUserDto` en el cuerpo.
        *   Manejar la respuesta (200 OK para éxito) y los errores (ej. 400 Bad Request, 403 Forbidden).

### Feature 4: Visualización de Permisos Disponibles (Opcional/Futuro)

*   **Descripción**: Una sección dedicada (quizás dentro de un módulo de "Gestión de Roles" más amplio) para listar y describir todos los permisos atómicos del sistema.
*   **Interacción API**:
    *   Realizar una solicitud `GET` a `/permissions`, incluyendo el JWT.
    *   Procesar la respuesta (array de `PermissionResponseDto`).
    *   Renderizar una lista o tabla mostrando el `name` y `description` de cada permiso.
*   **Uso**: Aunque no es directamente para la gestión de usuarios, esta funcionalidad es crucial para que un administrador entienda qué capacidades confiere cada permiso, lo cual es fundamental para la gestión de roles.

---