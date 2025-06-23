import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { CreateSubUserDto } from './dto/create-subuser.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        
      ) {}

async createSubUser(dto: CreateSubUserDto, owner: User): Promise<User> {
    if (!owner.isAdmin) {
      throw new ForbiddenException('Solo los administradores pueden crear usuarios.');
    }

    // 1. Contar usuarios actuales del grupo
    const [subUsers, count] = await this.userRepository.findAndCount({ where: { owner: { id: owner.id } } });
    const totalUsersInGroup = count + 1; // +1 por el propio owner

    // 2. Verificar el límite del plan de suscripción
    // Cargar la suscripción activa del owner
    const ownerWithSubscription = await this.userRepository.findOne({
      where: { id: owner.id },
      relations: ['subscriptions', 'subscriptions.subscriptionPlan'],
    });

    const activeSubscription = ownerWithSubscription?.subscriptions.find(s => s.status === 'active');
    const maxUsers = activeSubscription?.subscriptionPlan?.maxUsers || 1;

    if (totalUsersInGroup >= maxUsers) {
      throw new BadRequestException(`Límite de ${maxUsers} usuarios alcanzado para su plan de suscripción.`);
    }
    
    // 3. Crear el nuevo sub-usuario
    const existingUser = await this.userRepository.findOne({ where: { email: dto.email }});
    if (existingUser) {
        throw new BadRequestException('El email ya está en uso.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const newUser = this.userRepository.create({
      ...dto, // fullName, email, etc.
      password: hashedPassword,
      owner: owner, // Asignar el admin como dueño
      isAdmin: false, // Los sub-usuarios no son admins
      isActive: true,
      // Los permisos por defecto se toman de la entidad (ej. canManageClients: true)
    });

    return this.userRepository.save(newUser);
  }

   async findById(id: number): Promise<User | undefined> {
    return this.userRepository.findOneBy({ id });
  }

    async findUsersByOwner(ownerId: number): Promise<User[]> {
    return this.userRepository.find({
      where: { owner: { id: ownerId } },
    });
  }

  async updateByAdmin(userIdToUpdate: number, adminId: number, dto: AdminUpdateUserDto): Promise<User> {
    const userToUpdate = await this.userRepository.findOne({
        where: { id: userIdToUpdate, owner: { id: adminId } },
        relations: ['owner']
    });

    if (!userToUpdate) {
        throw new NotFoundException('Usuario no encontrado o no pertenece a su grupo.');
    }

    // Actualizar campos permitidos
    Object.assign(userToUpdate, dto); // El DTO contendrá campos como fullName, isActive, y los permisos (canManageClients, etc.)

    return this.userRepository.save(userToUpdate);
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

       async isUserInAdminGroup(userIdToCheck: number, adminId: number): Promise<boolean> {
    // Un admin siempre está en su propio "grupo"
    if (userIdToCheck === adminId) {
        return true;
    }
    const user = await this.userRepository.findOneBy({
      id: userIdToCheck,
      owner: { id: adminId },
    });
    return !!user; 
  }
            
}
