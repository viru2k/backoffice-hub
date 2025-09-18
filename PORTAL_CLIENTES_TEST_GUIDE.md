# 🚀 Guía de Pruebas - Portal de Clientes

## 📋 Preparación del Entorno

### 1. Ejecutar Seed de Datos
```bash
# Ejecutar el seed específico para portal de clientes
npm run seed:client-portal
```

### 2. Iniciar Backend
```bash
npm run start:dev
# Backend disponible en: http://localhost:3000
# Swagger/Docs en: http://localhost:3000/api/docs
```

---

## 👥 CLIENTES DE PRUEBA CREADOS

### ✅ Cliente 1 - **LISTO PARA PORTAL**
- **Nombre:** Juan Carlos Pérez González
- **Email:** `juan.perez@email.com`
- **Contraseña:** `cliente123`
- **Estado:** ACTIVO con portal habilitado
- **Datos personalizados:** Prefiere llamarse "Juancho"

### ✅ Cliente 2 - **MUJER EJEMPLO**
- **Nombre:** María José García Ruiz
- **Email:** `maria.garcia@email.com`
- **Contraseña:** `maria456`
- **Estado:** ACTIVA con portal habilitado
- **Datos personalizados:** Prefiere llamarse "Mari"

### 🔴 Cliente 3 - **SIN PORTAL** (Para probar habilitación)
- **Nombre:** Roberto Martínez López
- **Email:** `roberto.martinez@email.com`
- **Estado:** ACTIVO sin portal
- **Usar:** Botón "Habilitar Portal" desde admin

### ⚠️ Cliente 4 - **INACTIVO CON PORTAL**
- **Nombre:** Carmen Rodríguez Sánchez
- **Email:** `carmen.rodriguez@email.com`
- **Contraseña:** `carmen789`
- **Estado:** INACTIVA (no debería poder loguearse)

### ❌ Cliente 5 - **SIN EMAIL**
- **Nombre:** Antonio Jiménez Vega
- **Email:** null
- **Estado:** No se puede habilitar portal

---

## 🧪 CASOS DE PRUEBA

### 1. **Login Exitoso de Cliente**
```bash
POST /api/client/auth/login
{
  "email": "juan.perez@email.com",
  "password": "cliente123"
}
```
**Resultado esperado:** ✅ Token JWT + datos del cliente

### 2. **Consultar Perfil del Cliente**
```bash
GET /api/client/profile
Authorization: Bearer {token_del_cliente}
```
**Resultado esperado:** ✅ Perfil completo con campos protegidos y editables

### 3. **Editar Datos Permitidos**
```bash
PUT /api/client/profile
Authorization: Bearer {token_del_cliente}
{
  "preferredName": "Juan Carlos",
  "address": "Nueva dirección 456",
  "personalNotes": "Nuevas preferencias"
}
```
**Resultado esperado:** ✅ Actualización exitosa

### 4. **Intentar Editar Campos Protegidos** ❌
```bash
PUT /api/client/profile
Authorization: Bearer {token_del_cliente}
{
  "name": "Nombre Malicioso",
  "email": "hack@evil.com"
}
```
**Resultado esperado:** ❌ Error 403 - Campos protegidos

### 5. **Consultar Citas del Cliente**
```bash
GET /api/client/profile/appointments?page=1&limit=5
Authorization: Bearer {token_del_cliente}
```
**Resultado esperado:** ✅ Lista de citas (probablemente vacía inicialmente)

### 6. **Consultar Recompensas**
```bash
GET /api/client/profile/rewards
Authorization: Bearer {token_del_cliente}
```
**Resultado esperado:** ✅ Programas de recompensas y progreso

### 7. **Habilitar Portal desde Admin** (Para Roberto)
```bash
POST /api/clients/3/enable-portal
Authorization: Bearer {token_admin}
```
**Resultado esperado:** ✅ Contraseña temporal generada

### 8. **Reset de Contraseña**
```bash
POST /api/client/auth/forgot-password
{
  "email": "juan.perez@email.com"
}
```
**Resultado esperado:** ✅ Email enviado (verificar logs del backend)

---

## 🔍 VERIFICACIONES EN SWAGGER

Accede a: `http://localhost:3000/api/docs`

### Sección "Client Portal" incluye:
- `POST /client/auth/login` - Login del cliente
- `GET /client/profile` - Ver perfil
- `PUT /client/profile` - Editar perfil
- `PUT /client/profile/password` - Cambiar contraseña
- `GET /client/profile/appointments` - Ver citas
- `GET /client/profile/rewards` - Ver recompensas
- `GET /client/profile/history` - Ver historial

### Sección "Clients" incluye:
- `POST /clients/{id}/enable-portal` - Habilitar portal (admin)

---

## 🐛 POSIBLES PROBLEMAS Y SOLUCIONES

### Error: "Cliente no encontrado"
- ✅ **Solución:** Ejecutar primero seed de usuarios: `npm run seed:fullflow`

### Error: "No tiene acceso al portal"
- ✅ **Solución:** Usar cliente con `hasPortalAccess: true` o habilitar desde admin

### Error: "Token inválido para cliente"
- ✅ **Solución:** Asegurar que el token JWT tenga `type: 'client'`

### Error: "Cannot find module"
- ✅ **Solución:** Compilar proyecto: `npm run build`

---

## 📊 DATOS ESPERADOS EN BD

Después del seed, deberías ver en la base de datos:

```sql
-- Clientes con portal
SELECT id, fullname, email, hasPortalAccess, status, preferredName 
FROM client 
WHERE hasPortalAccess = 1;

-- Todos los clientes
SELECT id, fullname, email, hasPortalAccess, status 
FROM client 
ORDER BY hasPortalAccess DESC;
```

---

## 🎯 PRÓXIMOS PASOS

1. ✅ **Backend funcionando** - Portal 100% operativo
2. 🔄 **Frontend pendiente** - Implementar UI en orbyt
3. 🔧 **Mi-orbyt pendiente** - Crear app cliente
4. 📧 **Emails configurar** - Templates y SMTP

**¡El backend está listo para integración frontend!** 🚀