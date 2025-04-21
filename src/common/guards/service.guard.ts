import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class ServiceGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const requiredService = this.reflector.get<string>('service', context.getHandler());
    if (!requiredService) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const services = user?.subscription?.services || [];

    if (!services.includes(requiredService)) {
      throw new ForbiddenException(`Acceso denegado al servicio: ${requiredService}`);
    }

    return true;
  }
}
