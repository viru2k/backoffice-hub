# Requerimientos Backend - Mejoras Configuración Agenda

## Contexto
Se necesita reorganizar la configuración de agenda para mejorar la UX y gestión por usuario.

## Cambios Requeridos

### 1. Días Festivos
- Mover gestión de días festivos desde modal emergente a sección de configuración
- Mantener endpoints existentes: `/agenda/holiday` y `/agenda/holidays`

### 2. Configuración por Usuario
- Los días habilitados deben ser configurables por usuario individual
- Mantener endpoint existente: `/agenda/config` (GET/PATCH)
- Verificar que `professionalId` en query param funcione correctamente

### 3. Nuevos Campos de Configuración (si no existen)
Verificar si estos campos están disponibles en `AgendaConfigResponseDto`:
- ✅ `slotDurationMinutes` - Ya existe
- ✅ `allowOverbooking` - Ya existe (como `allowOverbooking`)
- ✅ `allowFreeTimeSlots` - **AGREGADO** - Permitir turnos libres sin cliente asignado
- ✅ `maxAdvanceBookingDays` - **AGREGADO** - Máximo días de antelación para reservar (default: 30)
- ✅ `minAdvanceBookingHours` - **AGREGADO** - Mínimo horas de antelación para reservar (default: 2)

### 4. Validaciones
- Verificar permisos `canManageAgenda` en todos los endpoints de configuración
- Asegurar que solo usuarios con permisos puedan modificar configuración de otros usuarios
- Mantener la lógica actual de holidays por profesional

## Endpoints Actuales (Validados)
- ✅ GET `/agenda/config?professionalId={id}` - Obtener configuración
- ✅ PATCH `/agenda/config?professionalId={id}` - Actualizar configuración
- ✅ GET `/agenda/holidays?professionalId={id}` - Obtener días festivos
- ✅ POST `/agenda/holiday` - Agregar día festivo
- ✅ DELETE `/agenda/holiday/{id}` - **IMPLEMENTADO** - Eliminar día festivo

## Inconsistencias en API (Para Corregir)
- ✅ `CreateHolidayDto` usa campo `reason` pero `HolidayResponseDto` usa campo `description`
- ✅ Unificado para usar `description` en ambos DTOs (mapeado internamente a `reason` en entidad)

## Frontend Changes Needed
1. Crear componente de configuración con switches PrimeNG
2. Mover modal de días festivos a la nueva sección
3. Implementar gestión por usuario con selector de profesional

---

# Requerimientos Backend - Dashboard de Inventario

## Contexto
El dashboard de inventario actualmente usa datos mock. Se necesitan endpoints específicos para obtener métricas consolidadas de inventario.

## Endpoints Requeridos ✅ COMPLETADOS

### 1. Dashboard General de Inventario
**GET** `/inventory/dashboard/metrics` ✅ **IMPLEMENTADO**

Debe retornar métricas consolidadas para el dashboard:
```typescript
interface InventoryDashboardMetricsDto {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  overStockProducts: number;
  totalInventoryValue: number;
  movementsToday: number;
  trends: {
    products: { trend: number; label: string };
    lowStock: { trend: number; label: string };
    value: { trend: number; label: string };
    movements: { trend: number; label: string };
  };
}
```

### 2. Movimientos Recientes Generales
**GET** `/inventory/movements/recent?limit=10` ✅ **IMPLEMENTADO**

Debe retornar movimientos recientes de todos los productos (no solo de uno específico):
```typescript
interface RecentMovementsDto {
  movements: StockMovementResponseDto[];
}
```

### 3. Productos con Stock Bajo
**GET** `/inventory/products/low-stock?limit=10` ✅ **IMPLEMENTADO**

Debe retornar productos con stock por debajo del mínimo:
```typescript
interface LowStockProductDto {
  id: number;
  name: string;
  description?: string;
  currentStock: number;
  minStock: number;
  status: 'warning' | 'danger'; // warning: stock bajo, danger: sin stock
}

interface LowStockProductsDto {
  products: LowStockProductDto[];
}
```

### 4. Datos para Gráficos
**GET** `/inventory/dashboard/stock-distribution` ✅ **IMPLEMENTADO**

Para el gráfico de distribución del stock:
```typescript
interface StockDistributionDto {
  normal: number;    // productos con stock normal
  low: number;       // productos con stock bajo
  empty: number;     // productos sin stock  
  over: number;      // productos con sobrestock
}
```

**GET** `/inventory/dashboard/movements-chart?period=7d` ✅ **IMPLEMENTADO**

Para el gráfico de movimientos semanales:
```typescript
interface MovementsChartDto {
  labels: string[];        // ['Lun', 'Mar', 'Mié', ...]
  entriesData: number[];   // datos de entradas por día
  exitsData: number[];     // datos de salidas por día
}
```

## Lógica de Negocio Sugerida

1. **Stock Bajo**: `currentStock <= minStock * 1.2`
2. **Sin Stock**: `currentStock = 0`
3. **Sobrestock**: `currentStock > optimalStock * 1.5` (si existe campo optimalStock)
4. **Stock Normal**: el resto
5. **Tendencias**: comparar con período anterior (mes/semana según la métrica)

## Endpoints Existentes (Ya funcionando)
- ✅ GET `/stock/{productId}` - Movimientos por producto específico
- ✅ GET `/stock/{productId}/summary` - Resumen de stock por producto
- ✅ POST `/stock` - Crear movimiento de stock

---

## ✅ RESUMEN DE IMPLEMENTACIÓN COMPLETADA

### Mejoras Configuración Agenda ✅ COMPLETADO
1. **DELETE `/agenda/holiday/{id}`** - Implementado con validaciones de permisos
2. **Unificación DTOs Holiday** - `CreateHolidayDto` y `HolidayResponseDto` ahora usan `description`
3. **Nuevos campos AgendaConfig**:
   - `allowFreeTimeSlots` - Permitir turnos libres (default: true)
   - `maxAdvanceBookingDays` - Máximo días antelación (default: 30)
   - `minAdvanceBookingHours` - Mínimo horas antelación (default: 2)

### Dashboard de Inventario ✅ COMPLETADO
1. **Módulo InventoryModule** - Creado con controlador y servicio
2. **Endpoints implementados**:
   - `GET /inventory/dashboard/metrics` - Métricas consolidadas
   - `GET /inventory/movements/recent?limit=10` - Movimientos recientes
   - `GET /inventory/products/low-stock?limit=10` - Productos stock bajo
   - `GET /inventory/dashboard/stock-distribution` - Distribución stock
   - `GET /inventory/dashboard/movements-chart?period=7d` - Gráfico movimientos
3. **Entidad Product actualizada** - Agregados campos `currentStock` y `minStock`
4. **DTOs completos** - Todas las interfaces requeridas implementadas
5. **Lógica de negocio** - Stock bajo, sobrestock, tendencias implementadas

### Archivos Creados/Modificados:
**Agenda:**
- `src/agenda/agenda.service.ts` - Agregado `deleteHoliday()`
- `src/agenda/agenda.controller.ts` - Agregado `DELETE /holiday/:id`
- `src/agenda/entities/create-holiday.dto.ts` - Cambiado `reason` → `description`
- `src/agenda/entities/agenda-config.entity.ts` - Agregados 3 campos nuevos
- `src/agenda/dto/agenda-config-response.dto.ts` - Actualizados DTOs

**Inventario:**
- `src/inventory/inventory.module.ts` - Módulo completo
- `src/inventory/inventory.controller.ts` - 5 endpoints implementados
- `src/inventory/inventory.service.ts` - Lógica completa de métricas
- `src/inventory/dto/*.dto.ts` - 5 DTOs con todas las interfaces
- `src/product/entities/product.entity.ts` - Campos stock agregados
- `src/app.module.ts` - InventoryModule importado

El frontend ya puede consumir todos los endpoints requeridos. ✅