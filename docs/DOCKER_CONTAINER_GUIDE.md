# Guía de Contenedores Docker

## Configuración de Contenedores

### Contenedores Configurados

#### 1. db-1 (PostgreSQL Database) ✅ CORRIENDO
**Estado:** Corriendo (deseado)
**Puerto:** 5432
**Propósito:** Base de datos principal para el backoffice

```bash
# Ver estado del contenedor
docker ps | grep db-1

# Ver logs de la base de datos
docker logs db-1

# Conectar a la base de datos
docker exec -it db-1 psql -U postgres -d backoffice_db
```

#### 2. app-1 (Backend Application) ✅ CORRIENDO
**Estado:** Corriendo (deseado)
**Puerto:** 3000
**Propósito:** API backend del sistema backoffice

```bash
# Ver estado del contenedor
docker ps | grep app-1

# Ver logs de la aplicación
docker logs app-1

# Ejecutar comandos en el contenedor
docker exec -it app-1 bash
```

#### 3. backoffice-hub ✅ DETENIDO
**Estado:** Detenido (deseado)
**Propósito:** Contenedor de desarrollo/construcción

```bash
# Este contenedor no debería estar corriendo en producción
# Se usa solo para builds y desarrollo
docker ps -a | grep backoffice-hub
```

#### 4. Landing Container ❓ NO VISIBLE
**Estado:** No configurado o en diferente contexto
**Ubicación posible:** `C:/repositories/orbyt-repositories/orbyt/orbyt/orbyt-landing`

## Comandos para Levantar Contenedores

### Opción 1: Levantar todos los servicios
```bash
# Desde el directorio raíz del proyecto
docker-compose up -d

# Ver estado de todos los contenedores
docker-compose ps
```

### Opción 2: Levantar contenedores individualmente

#### Base de Datos (PostgreSQL)
```bash
# Levantar solo la base de datos
docker-compose up -d db

# Verificar que esté corriendo
docker logs db-1
```

#### Aplicación Backend
```bash
# Levantar solo la aplicación (requiere DB corriendo)
docker-compose up -d app

# Ver logs en tiempo real
docker logs -f app-1
```

#### Verificación de Servicios
```bash
# Ver todos los contenedores corriendo
docker ps

# Ver todos los contenedores (incluyendo detenidos)
docker ps -a

# Ver uso de recursos
docker stats
```

## Configuración de Red y Puertos

### Puertos Expuestos
- **3000**: Backend API (app-1)
- **5432**: PostgreSQL Database (db-1)

### Variables de Entorno
Verificar en `docker-compose.yml`:
- `DATABASE_URL`
- `JWT_SECRET`
- `PORT`

## Troubleshooting

### Problema: Contenedor no inicia
```bash
# Ver logs de error
docker logs [container_name]

# Reiniciar contenedor
docker restart [container_name]

# Reconstruir si hay cambios
docker-compose up -d --build
```

### Problema: Puerto ocupado
```bash
# Ver qué proceso usa el puerto
netstat -tulpn | grep :3000

# Matar proceso si es necesario
lsof -ti:3000 | xargs kill -9
```

### Problema: Base de datos no conecta
```bash
# Verificar que PostgreSQL está corriendo
docker exec -it db-1 pg_isready

# Verificar conexión desde la app
docker exec -it app-1 npm run typeorm:status
```

## Comandos de Desarrollo

### Rebuild de la aplicación
```bash
# Reconstruir solo el contenedor de app
docker-compose up -d --build app

# Reconstruir todos los servicios
docker-compose up -d --build
```

### Acceso a contenedores
```bash
# Bash en el contenedor de app
docker exec -it app-1 bash

# Psql en la base de datos
docker exec -it db-1 psql -U postgres -d backoffice_db
```

### Limpieza de contenedores
```bash
# Detener todos los contenedores
docker-compose down

# Limpiar volúmenes (¡CUIDADO! borra datos)
docker-compose down -v

# Limpiar imágenes no usadas
docker system prune -a
```

## Estado Actual del Sistema

### ✅ Funcionando Correctamente
- **db-1**: PostgreSQL corriendo en puerto 5432
- **app-1**: Backend API corriendo en puerto 3000
- **Comunicación**: App conecta correctamente a la base de datos

### 🔄 Servicios Detenidos (Normal)
- **backoffice-hub**: Contenedor de desarrollo, no necesita estar corriendo

### ❓ Landing Container - Explicación

El contenedor de landing **NO está visible** porque:

1. **Ubicación diferente**: Se encuentra en `C:/repositories/orbyt-repositories/orbyt/orbyt/orbyt-landing`
2. **Docker Compose separado**: Tiene su propio `docker-compose.yml`
3. **Contexto independiente**: No forma parte del backoffice-hub

#### Para ver el contenedor de landing:
```bash
# Navegar al directorio de landing
cd C:/repositories/orbyt-repositories/orbyt/orbyt/orbyt-landing

# Ver contenedores de landing
docker-compose ps

# Levantar landing si es necesario
docker-compose up -d
```

## Verificación del Sistema Completo

```bash
# 1. Verificar contenedores del backoffice
cd C:/repositories/orbyt-repositories/backoffice-hub
docker-compose ps

# 2. Verificar contenedores de landing
cd C:/repositories/orbyt-repositories/orbyt/orbyt/orbyt-landing
docker-compose ps

# 3. Ver todos los contenedores en el sistema
docker ps -a
```

## Monitoreo y Logs

### Ver logs en tiempo real
```bash
# Logs de la aplicación
docker logs -f app-1

# Logs de la base de datos
docker logs -f db-1

# Logs de todos los servicios
docker-compose logs -f
```

### Monitoreo de recursos
```bash
# Ver uso de CPU y memoria
docker stats

# Ver espacio en disco usado por Docker
docker system df
```

---

**Nota**: El sistema actual está funcionando correctamente con db-1 y app-1 corriendo. El contenedor de landing está en un proyecto separado y debe manejarse independientemente.