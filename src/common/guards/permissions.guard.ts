import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user }: { user: User } = context.switchToHttp().getRequest();

    if (!user || !user.roles) {
      throw new ForbiddenException('No se encontró información de usuario o roles.');
    }

    // Aplanar todos los permisos de todos los roles del usuario en un único Set
    const userPermissions = new Set(
      user.roles.flatMap((role) => role.permissions?.map((p) => p.name) || [])
    );

    // Comprobar si el usuario tiene al menos uno de los permisos requeridos
    const hasPermission = requiredPermissions.some((permission) =>
      userPermissions.has(permission),
    );

    if (hasPermission) {
      return true;
    }

    throw new ForbiddenException('No tienes los permisos necesarios para realizar esta acción.');
  }
}