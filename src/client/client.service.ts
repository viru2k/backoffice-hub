import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client, ClientStatus } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { DeactivateClientDto } from './dto/deactivate-client.dto';
import { User } from '../user/entities/user.entity';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

async create(createClientDto: CreateClientDto, user: User): Promise<Client> {
    // Generate unique membership number if not provided
    const membershipNumber = createClientDto.membershipNumber || await this.generateUniqueMembershipNumber();
    
    const newClient = this.clientRepository.create({
      ...createClientDto,
      membershipNumber,
      status: createClientDto.status || ClientStatus.CREATED, 
      owner: user,
      user: user,
    });
    return this.clientRepository.save(newClient);
  }

  async findAll(requestingUser: User, targetUserId: number, includeInactive = false): Promise<Client[]> {
    const where: any = { owner: { id: targetUserId } };

    // By default, only show active clients
    if (!includeInactive) {
      where.isActive = true;
    }

    return this.clientRepository.find({
      where,
      relations: ['owner'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(clientId: number, requestingUser: User, targetUserId: number): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { id: clientId, owner: { id: targetUserId } },
      relations: ['owner'],
    });
    if (!client) {
      throw new NotFoundException('Cliente no encontrado o no pertenece al usuario especificado.');
    }
    return client;
  }

async update(id: number, updateClientDto: UpdateClientDto, requestingUser: User): Promise<Client> {
    const client = await this.findOne(id, requestingUser, requestingUser.id);    
    this.clientRepository.merge(client, updateClientDto);
    return this.clientRepository.save(client);
  }

  async remove(id: number, requestingUser: User): Promise<void> {
    const client = await this.findOne(id, requestingUser, requestingUser.id);
    await this.clientRepository.remove(client);
  }

  async findAllByGroup(adminId: number): Promise<Client[]> {
    return this.clientRepository.createQueryBuilder('client')
      .leftJoinAndSelect('client.owner', 'owner')
      .where('owner.id = :adminId OR owner.owner_id = :adminId', { adminId })
      .getMany();
  }

  // Soft delete methods
  async deactivate(id: number, deactivateDto: DeactivateClientDto, requestingUser: User): Promise<Client> {
    const client = await this.findOne(id, requestingUser, requestingUser.id);

    if (!client.isActive) {
      throw new NotFoundException('Client is already deactivated');
    }

    client.isActive = false;
    client.deactivatedAt = new Date();
    client.deactivatedBy = requestingUser.id;
    client.deactivationReason = deactivateDto.reason;

    return this.clientRepository.save(client);
  }

  async reactivate(id: number, requestingUser: User): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { id, owner: { id: requestingUser.id } },
      relations: ['owner'],
    });

    if (!client) {
      throw new NotFoundException('Cliente no encontrado o no pertenece al usuario especificado.');
    }

    if (client.isActive) {
      throw new NotFoundException('Client is already active');
    }

    client.isActive = true;
    client.deactivatedAt = null;
    client.deactivatedBy = null;
    client.deactivationReason = null;

    return this.clientRepository.save(client);
  }

  // Get only active clients for appointments and services
  async findActiveClients(requestingUser: User, targetUserId: number): Promise<Client[]> {
    return this.clientRepository.find({
      where: {
        owner: { id: targetUserId },
        isActive: true
      },
      relations: ['owner'],
      order: { createdAt: 'DESC' },
    });
  }

  private async generateUniqueMembershipNumber(): Promise<string> {
    let membershipNumber: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      // Generate a membership number with format: ORB-YYYYMMDD-XXXX
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomPart = Math.floor(1000 + Math.random() * 9000).toString();
      membershipNumber = `ORB-${date}-${randomPart}`;

      attempts++;
      if (attempts >= maxAttempts) {
        // Fallback to timestamp-based number
        membershipNumber = `ORB-${Date.now()}`;
        break;
      }

      // Check if this membership number already exists
      const existingClient = await this.clientRepository.findOne({
        where: { membershipNumber }
      });

      if (!existingClient) {
        break;
      }
    } while (true);

    return membershipNumber;
  }
}
