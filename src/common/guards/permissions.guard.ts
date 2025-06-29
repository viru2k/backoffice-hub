import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Obtener los permisos requeridos para la ruta desde los metadatos.
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si la ruta no tiene el decorador @Permissions, se permite el acceso.
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // 2. Obtener el objeto de usuario de la petición.
    const { user }: { user: User } = context.switchToHttp().getRequest();

    // Si no hay usuario (ej. una ruta pública que accidentalmente tiene el guardián), denegar.
    if (!user) {
        throw new ForbiddenException('No se encontró información de usuario.');
    }

    // Un administrador de cuenta siempre tiene todos los permisos.
    if (user.isAdmin) {
        return true;
    }

    // 3. Comprobar si el usuario tiene TODOS los permisos requeridos.
    const hasAllPermissions = requiredPermissions.every(
      (permission) => user[permission] === true,
    );

    if (hasAllPermissions) {
      return true;
    } else {
      // Si no tiene los permisos, lanzar una excepción.
      throw new ForbiddenException('No tienes los permisos necesarios para realizar esta acción.');
    }
  }
}