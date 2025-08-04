import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { CreateSubUserDto } from './dto/create-subuser.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { Role } from '../roles/entities/role.entity';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
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
      roles: [], // Initialize roles for new sub-user
    });

    return this.userRepository.save(newUser);
  }

   async findById(id: number): Promise<User | undefined> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'roles.permissions'],
    });
  }

    async findUsersByOwner(ownerId: number): Promise<User[]> {
    return this.userRepository.find({
      where: { owner: { id: ownerId } },
      relations: ['roles', 'roles.permissions'], // Ensure roles are loaded for group users
    });
  }

  async updateByAdmin(userIdToUpdate: number, adminId: number, dto: AdminUpdateUserDto): Promise<User> {
    const userToUpdate = await this.userRepository.findOne({
        where: { id: userIdToUpdate, owner: { id: adminId } },
        relations: ['owner', 'roles'] // Load roles for update
    });

    if (!userToUpdate) {
        throw new NotFoundException('Usuario no encontrado o no pertenece a su grupo.');
    }

    // Update simple fields
    if (dto.fullName !== undefined) userToUpdate.name = dto.fullName.split(' ')[0]; // Assuming first word is name
    if (dto.fullName !== undefined) userToUpdate.lastName = dto.fullName.split(' ').slice(1).join(' '); // Rest is lastName
    if (dto.isActive !== undefined) userToUpdate.isActive = dto.isActive;

    // Handle role updates
    if (dto.roleIds !== undefined) {
      if (dto.roleIds.length > 0) {
        const roles = await this.roleRepository.findByIds(dto.roleIds);
        if (roles.length !== dto.roleIds.length) {
          throw new BadRequestException('One or more role IDs are invalid.');
        }
        userToUpdate.roles = roles;
      } else {
        userToUpdate.roles = []; // Clear roles if an empty array is provided
      }
    }

    return this.userRepository.save(userToUpdate);
  }

   async createUser(data: Partial<User>): Promise<User> {
    const newUser = this.userRepository.create(data);
    return this.userRepository.save(newUser);
  }


    async findByEmail(email: string): Promise<User> {
        return this.userRepository.findOne({ where: { email }, relations: ['roles', 'roles.permissions'] });
      }

      async getSubUsers(ownerId: number) {
        return this.userRepository.find({
          where: { owner: { id: ownerId } },
          relations: ['roles', 'roles.permissions'], // Ensure roles are loaded for sub-users
        });
      }
      async toggleSubUser(id: number, ownerId: number) {
        const user = await this.userRepository.findOne({
          where: { id, owner: { id: ownerId } },
          relations: ['roles', 'roles.permissions'], // Ensure roles are loaded for toggle
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
    const user = await this.userRepository.findOne({
      where: { id: userIdToCheck, owner: { id: adminId } },
      relations: ['roles'], // Only need roles to check if user is in admin group
    });
    return !!user; 
  }
            
}
