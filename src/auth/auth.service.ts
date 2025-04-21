import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Subscription } from 'src/subscription/entities/subscription.entity';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { RegisterUserDto } from 'src/user/dto/register-subuser.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async register(dto: RegisterUserDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const now = new Date();
    const end = new Date();
    if (dto.subscriptionType === 'monthly') end.setMonth(now.getMonth() + 1);
    if (dto.subscriptionType === 'semester') end.setMonth(now.getMonth() + 6);
    if (dto.subscriptionType === 'annual') end.setFullYear(now.getFullYear() + 1);

    const subscription = this.subscriptionRepo.create({
      name: `Plan ${dto.subscriptionType}`,
      type: dto.subscriptionType,
      services: dto.services,
      startDate: now,
      endDate: end,
    });
    await this.subscriptionRepo.save(subscription);

    const user = this.userRepo.create({
      email: dto.email,
      password: hashedPassword,
      isAdmin: true,
      subscription,
    });
    await this.userRepo.save(user);

    const payload = { email: user.email, sub: user.id, isAdmin: user.isAdmin };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  // login y validateUser también deben estar
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findByEmail(email);
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, isAdmin: user.isAdmin };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
