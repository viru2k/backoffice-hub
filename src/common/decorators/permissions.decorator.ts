import { SetMetadata } from '@nestjs/common';

// La clave que usaremos para almacenar y recuperar los metadatos de permisos.
export const PERMISSIONS_KEY = 'permissions';

// El decorador que aplicaremos a nuestras rutas.
// Acepta uno o más nombres de permisos (que deben coincidir con las propiedades en la entidad User).
export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);