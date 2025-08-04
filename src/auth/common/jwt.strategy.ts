import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from './constants';
import { UserService } from '../../user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor( private readonly userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret, 
    });
  }

 async validate(payload: any) {
    // Este método solo se ejecuta si la firma del token es válida
    const user = await this.userService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    // La comprobación de 'isActive' también se hace aquí para cada petición a una ruta protegida
    if (!user.isActive) {
      throw new UnauthorizedException('La cuenta de usuario está deshabilitada.');
    }
    const { password, ...result } = user; // No devolver la contraseña
    return result;
  }

  
}
