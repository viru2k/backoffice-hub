import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
/* import { JwtStrategy } from './jwt.strategy';
import { jwtConstants } from './constants'; */
import { UserModule } from 'src/user/user.module';
import { jwtConstants } from './common/constants';
import { JwtStrategy } from './common/jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from 'src/subscription/entities/subscription.entity';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1d' },
    }),
    TypeOrmModule.forFeature([Subscription, User])
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
