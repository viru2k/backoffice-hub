import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { UserModule } from './../user/user.module';
import { jwtConstants } from './common/constants';
import { JwtStrategy } from './common/jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from './../subscription/entities/subscription.entity';
import { SubscriptionPlan } from './../subscription-plan/entities/subscription-plan.entity';
import { LocalStrategy } from './common/local.strategy';


@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1d' },
    }),
    TypeOrmModule.forFeature([Subscription,SubscriptionPlan])
  ],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  controllers: [AuthController],
  exports: [TypeOrmModule],
})
export class AuthModule {}

