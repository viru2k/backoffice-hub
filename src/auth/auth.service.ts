import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './../user/user.service';
import * as bcrypt from 'bcryptjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Subscription } from './../subscription/entities/subscription.entity';
import { SubscriptionPlan } from './../subscription-plan/entities/subscription-plan.entity';
import { User } from './../user/entities/user.entity';
import { Repository } from 'typeorm';
import { RegisterUserDto } from './dto/register-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(SubscriptionPlan)
    private readonly subscriptionPlanRepo: Repository<SubscriptionPlan>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async register(dto: RegisterUserDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const now = new Date();
    const end = new Date(now);
    if (dto.subscriptionType === 'monthly') {
      end.setMonth(end.getMonth() + 1);
    } else if (dto.subscriptionType === 'semester') {
      end.setMonth(end.getMonth() + 6);
    } else if (dto.subscriptionType === 'annual') {
      end.setFullYear(end.getFullYear() + 1);
    } else {
      throw new BadRequestException('Invalid subscription type');
    }
    

    // Buscar el SubscriptionPlan correspondiente
    const planName = this.getPlanName(dto.subscriptionType);
    const subscriptionPlan = await this.subscriptionPlanRepo.findOne({
      where: { name: planName },
    });

    if (!subscriptionPlan) {
      throw new NotFoundException(`Subscription plan ${planName} not found`);
    }

    // Crear la suscripción asociada al plan
    const subscription = this.subscriptionRepo.create({
      subscriptionPlan: subscriptionPlan,
      startDate: now,
      endDate: end,
      status: 'active',
    });

    await this.subscriptionRepo.save(subscription);

    // Crear el usuario principal
    const user = this.userRepo.create({
      email: dto.email,
      password: hashedPassword,
      fullName: dto.fullName,
      isAdmin: true,
      isActive: true,
      subscriptions: [subscription], // <<< ahora sí plural
    });

    await this.userRepo.save(user);

    // Actualizar la suscripción con el usuario
    subscription.user = user;
    await this.subscriptionRepo.save(subscription);

    // Crear el JWT
    const payload = { email: user.email, sub: user.id, isAdmin: user.isAdmin };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  private getPlanName(subscriptionType: string): string {
    if (subscriptionType === 'monthly') return 'Starter';
    if (subscriptionType === 'semester') return 'Professional';
    if (subscriptionType === 'annual') return 'Enterprise';
    throw new Error('Invalid subscription type');
  }

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Contraseña incorrecta');
    }

    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    const payload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
