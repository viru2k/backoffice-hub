import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { CreateSubUserDto } from './dto/create-subuser.dto';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
      ) {}

      async createSubUser(ownerId: number, dto: CreateSubUserDto): Promise<User> {
        const owner = await this.userRepository.findOne({
          where: { id: ownerId },
          relations: ['subscription'],
        });
      
        if (!owner || !owner.isAdmin) {
          throw new Error('Usuario no autorizado o inválido');
        }
      
        const hashed = await bcrypt.hash(dto.password, 10);
      
        const subUser = this.userRepository.create({
          email: dto.email,
          password: hashed,
          isAdmin: false,
          owner,
          subscription: owner.subscription,
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
