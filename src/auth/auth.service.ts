import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common'; // Cambiar LoggerService por Logger
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
  // --- CORRECCIÓN DEL LOGGER ---
  // Así se instancia el logger de NestJS.
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(SubscriptionPlan)
    private readonly subscriptionPlanRepo: Repository<SubscriptionPlan>,
    // Ya no es necesario inyectar UserRepository ni LoggerService aquí
  ) {}

  async register(registerUserDto: RegisterUserDto) {
    // --- CORRECCIÓN DEL DTO ---

    const { email, password, name, subscriptionType } = registerUserDto;
    
    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new UnauthorizedException('El correo electrónico ya está en uso.');
    }
    
    // El plan se obtiene a partir del 'subscriptionType'
    const planName = this.getPlanName(subscriptionType);
    const plan = await this.subscriptionPlanRepo.findOneBy({ name: planName });
    if (!plan) {
      throw new BadRequestException('Tipo de suscripción no válido.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // --- CORRECCIÓN DEL MÉTODO DE CREACIÓN ---
    // UserService no tiene un método 'create'. Creamos el usuario aquí
    // y lo guardamos a través del servicio o directamente si el servicio no lo expone.
    // Lo ideal es que UserService tenga un método para esto. Vamos a asumir que lo añadimos.
    // (Ver el cambio necesario en UserService más abajo)
    const newUser = await this.userService.createUser({
      email,
      password: hashedPassword,
      name: name, 
      lastName: '', // El DTO no provee lastName, lo dejamos vacío o lo ajustamos
      isAdmin: true, // El primer usuario registrado es siempre admin de su cuenta
    });

    const subscription = this.subscriptionRepo.create({
      user: newUser,
      subscriptionPlan: plan,
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      status: 'active',
    });
    await this.subscriptionRepo.save(subscription);

    const payload = { sub: newUser.id, username: newUser.email, isAdmin: newUser.isAdmin };
    return {
      access_token: this.jwtService.sign(payload),
      user: newUser, // Devolver el usuario creado
    };
  }

  // Este método privado traduce el tipo de suscripción del DTO al nombre del Plan
  private getPlanName(subscriptionType: string): string {
    if (subscriptionType === 'monthly') return 'Starter';
    if (subscriptionType === 'semester') return 'Professional';
    if (subscriptionType === 'annual') return 'Enterprise'; // Asumiendo que existe un plan Enterprise
    throw new BadRequestException('Tipo de suscripción inválido');
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.userService.findByEmail(email);

    this.logger.debug(`Validando usuario: ${email}`);
    if (!user) {
        return null;
    }
    this.logger.debug(`Usuario encontrado. ID: ${user.id}, isActive: ${user.isActive}`);

    const isMatch = await bcrypt.compare(pass, user.password);

    if (isMatch && user.isActive) {
      this.logger.log(`Validación exitosa para usuario activo: ${email}`);
      const { password, ...result } = user;
      return result;
    }
    
    if (isMatch && !user.isActive) {
      this.logger.warn(`Intento de login para usuario INACTIVO: ${email}`);
      return null; 
    }
    
    this.logger.warn(`Contraseña incorrecta para el usuario: ${email}`);
    return null;
  }

  async login(user: any) {
    const payload = { username: user.email, sub: user.id, isAdmin: user.isAdmin };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}