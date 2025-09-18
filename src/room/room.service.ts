import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from '../agenda/entities/room.entity';
import { User } from '../user/entities/user.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomFiltersDto } from './dto/room-filters.dto';
import { RoomResponseDto, RoomOwnerResponseDto } from './dto/room-response.dto';
import { RoomListResponseDto } from './dto/room-list-response.dto';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
  ) {}

  async create(createRoomDto: CreateRoomDto, user: User): Promise<RoomResponseDto> {
    // Check for existing room with same name for this user
    const existingRoom = await this.roomRepository.findOne({
      where: {
        name: createRoomDto.name,
        owner: { id: user.id }
      }
    });

    if (existingRoom) {
      throw new BadRequestException(`Room with name '${createRoomDto.name}' already exists`);
    }

    const room = this.roomRepository.create({
      ...createRoomDto,
      owner: user,
    });

    const savedRoom = await this.roomRepository.save(room);

    // Fetch the room with owner details
    const roomWithOwner = await this.roomRepository.findOne({
      where: { id: savedRoom.id },
      relations: ['owner'],
    });

    return this.mapToResponseDto(roomWithOwner);
  }

  async findAll(filters: RoomFiltersDto, user: User): Promise<RoomListResponseDto> {
    const queryBuilder = this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.owner', 'owner')
      .where('room.owner = :ownerId', { ownerId: user.id });

    // Apply search filter
    if (filters.search) {
      queryBuilder.andWhere(
        '(LOWER(room.name) LIKE LOWER(:search) OR LOWER(room.description) LIKE LOWER(:search) OR LOWER(room.location) LIKE LOWER(:search))',
        { search: `%${filters.search}%` }
      );
    }

    // Apply status filter
    if (filters.isActive !== undefined) {
      queryBuilder.andWhere('room.isActive = :isActive', { isActive: filters.isActive });
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    queryBuilder
      .orderBy('room.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const rooms = await queryBuilder.getMany();
    const totalPages = Math.ceil(total / limit);

    return {
      rooms: rooms.map(room => this.mapToResponseDto(room)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: number, user: User): Promise<RoomResponseDto> {
    const room = await this.roomRepository.findOne({
      where: { id, owner: { id: user.id } },
      relations: ['owner'],
    });

    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    return this.mapToResponseDto(room);
  }

  async update(id: number, updateRoomDto: UpdateRoomDto, user: User): Promise<RoomResponseDto> {
    const room = await this.roomRepository.findOne({
      where: { id, owner: { id: user.id } },
      relations: ['owner'],
    });

    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    // Check for duplicate name if name is being updated
    if (updateRoomDto.name && updateRoomDto.name !== room.name) {
      const existingRoom = await this.roomRepository.findOne({
        where: {
          name: updateRoomDto.name,
          owner: { id: user.id }
        }
      });

      if (existingRoom) {
        throw new BadRequestException(`Room with name '${updateRoomDto.name}' already exists`);
      }
    }

    Object.assign(room, updateRoomDto);
    const updatedRoom = await this.roomRepository.save(room);

    return this.mapToResponseDto(updatedRoom);
  }

  async remove(id: number, user: User): Promise<void> {
    const room = await this.roomRepository.findOne({
      where: { id, owner: { id: user.id } },
    });

    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    await this.roomRepository.remove(room);
  }

  async toggleStatus(id: number, user: User): Promise<RoomResponseDto> {
    const room = await this.roomRepository.findOne({
      where: { id, owner: { id: user.id } },
      relations: ['owner'],
    });

    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    room.isActive = !room.isActive;
    const updatedRoom = await this.roomRepository.save(room);

    return this.mapToResponseDto(updatedRoom);
  }

  private mapToResponseDto(room: Room): RoomResponseDto {
    return {
      id: room.id,
      name: room.name,
      description: room.description,
      capacity: room.capacity,
      location: room.location,
      isActive: room.isActive,
      owner: {
        id: room.owner.id,
        email: room.owner.email,
        fullName: room.owner.fullName,
      } as RoomOwnerResponseDto,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };
  }
}