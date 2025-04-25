import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
  ) {}

  async create(dto: CreateClientDto, user: User) {
    const client = this.clientRepo.create({ ...dto, owner: user });
    return this.clientRepo.save(client);
  }

  async findAll(userId: number) {
    return this.clientRepo.find({ where: { owner: { id: userId } } });
  }

  async findOne(id: number, userId: number) {
    const client = await this.clientRepo.findOne({
      where: { id, owner: { id: userId } },
    });

    if (!client) throw new NotFoundException('Cliente no encontrado');
    return client;
  }

  async update(id: number, dto: UpdateClientDto, userId: number) {
    const client = await this.findOne(id, userId);
    Object.assign(client, dto);
    return this.clientRepo.save(client);
  }

  async remove(id: number, userId: number) {
    const client = await this.findOne(id, userId);
    return this.clientRepo.remove(client);
  }
}
