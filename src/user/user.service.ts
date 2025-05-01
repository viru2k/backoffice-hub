import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { CreateSubUserDto } from './dto/create-subuser.dto';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
      ) {}

      async createSubUser(dto: CreateSubUserDto, owner: User) {
        if (!owner.subscriptions || owner.subscriptions.length === 0) {
          throw new BadRequestException('The owner does not have an active subscription.');
        }
    
        const hashedPassword = await bcrypt.hash(dto.password, 10);
    
        const subUser = this.userRepository.create({
          email: dto.email,
          password: hashedPassword,
          isAdmin: false,
          isActive: true,
          owner,
          subscriptions: [owner.subscriptions[0]], // Asignamos la misma suscripción del owner
        });
    
        return this.userRepository.save(subUser);
      }
    async findByEmail(email: string): Promise<User> {
        return this.userRepository.findOne({ where: { email } });
      }

      async getSubUsers(ownerId: number) {
        return this.userRepository.find({
          where: { owner: { id: ownerId } },
        });
      }
      async toggleSubUser(id: number, ownerId: number) {
        const user = await this.userRepository.findOne({
          where: { id, owner: { id: ownerId } },
        });
      
        if (!user) {
          throw new Error('Subusuario no encontrado o no autorizado.');
        }
      
        user.isActive = !user.isActive;
        return this.userRepository.save(user);
      }
            
}
