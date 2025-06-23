import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client, ClientStatus } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

async create(createClientDto: CreateClientDto, user: User): Promise<Client> {
    const newClient = this.clientRepository.create({
      ...createClientDto,
      status: createClientDto.status || ClientStatus.CREATED, 
      owner: user,
      user: user,
    });
    return this.clientRepository.save(newClient);
  }

  async findAll(requestingUser: User, targetUserId: number): Promise<Client[]> {
    return this.clientRepository.find({
      where: { owner: { id: targetUserId } },
      relations: ['owner'],
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
}
