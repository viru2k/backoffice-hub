import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Service, ServiceStatus } from './entities/service.entity';
import { User } from '../user/entities/user.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceFiltersDto } from './dto/service-filters.dto';
import { ServiceResponseDto } from './dto/service-response.dto';
import { ServiceListResponseDto } from './dto/service-list-response.dto';

@Injectable()
export class ServiceService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  async create(createServiceDto: CreateServiceDto, user: User): Promise<ServiceResponseDto> {
    // Check if service with same name already exists for this user
    const existingService = await this.serviceRepository.findOne({
      where: {
        name: createServiceDto.name,
        ownerId: user.id,
      },
    });

    if (existingService) {
      throw new BadRequestException(`Service with name '${createServiceDto.name}' already exists`);
    }

    const service = this.serviceRepository.create({
      ...createServiceDto,
      ownerId: user.id,
      status: createServiceDto.status || ServiceStatus.ACTIVE,
    });

    const savedService = await this.serviceRepository.save(service);
    return this.mapToResponseDto(savedService);
  }

  async findAll(filters: ServiceFiltersDto, user: User): Promise<ServiceListResponseDto> {
    const query = this.serviceRepository.createQueryBuilder('service')
      .where('service.ownerId = :ownerId', { ownerId: user.id })
      .orderBy('service.createdAt', 'DESC');

    if (filters.search) {
      query.andWhere('(service.name LIKE :search OR service.description LIKE :search)', {
        search: `%${filters.search}%`
      });
    }

    if (filters.category) {
      query.andWhere('service.category = :category', { category: filters.category });
    }

    if (filters.status) {
      query.andWhere('service.status = :status', { status: filters.status });
    }

    // Add pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    query.skip(offset).take(limit);

    const [services, total] = await query.getManyAndCount();

    return {
      services: services.map(service => this.mapToResponseDto(service)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number, user: User): Promise<ServiceResponseDto> {
    const service = await this.serviceRepository.findOne({
      where: { id, ownerId: user.id },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    return this.mapToResponseDto(service);
  }

  async update(id: number, updateServiceDto: UpdateServiceDto, user: User): Promise<ServiceResponseDto> {
    const service = await this.serviceRepository.findOne({
      where: { id, ownerId: user.id },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    // Check if updating name would create a duplicate
    if (updateServiceDto.name && updateServiceDto.name !== service.name) {
      const existingService = await this.serviceRepository.findOne({
        where: {
          name: updateServiceDto.name,
          ownerId: user.id,
          id: Not(id),
        },
      });

      if (existingService) {
        throw new BadRequestException(`Service with name '${updateServiceDto.name}' already exists`);
      }
    }

    // Update service properties
    Object.assign(service, updateServiceDto);

    const updatedService = await this.serviceRepository.save(service);
    return this.mapToResponseDto(updatedService);
  }

  async remove(id: number, user: User): Promise<void> {
    const service = await this.serviceRepository.findOne({
      where: { id, ownerId: user.id },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    await this.serviceRepository.remove(service);
  }

  async getCategories(user: User): Promise<string[]> {
    const result = await this.serviceRepository
      .createQueryBuilder('service')
      .select('DISTINCT service.category', 'category')
      .where('service.ownerId = :ownerId', { ownerId: user.id })
      .andWhere('service.category IS NOT NULL')
      .andWhere('service.category != ""')
      .getRawMany();

    return result.map(row => row.category);
  }

  async toggleStatus(id: number, user: User): Promise<ServiceResponseDto> {
    const service = await this.serviceRepository.findOne({
      where: { id, ownerId: user.id },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    service.status = service.status === ServiceStatus.ACTIVE
      ? ServiceStatus.INACTIVE
      : ServiceStatus.ACTIVE;

    const updatedService = await this.serviceRepository.save(service);
    return this.mapToResponseDto(updatedService);
  }

  private mapToResponseDto(service: Service): ServiceResponseDto {
    return {
      id: service.id,
      name: service.name,
      description: service.description,
      category: service.category,
      basePrice: service.basePrice,
      duration: service.duration,
      status: service.status,
      notes: service.notes,
      thumbnailUrl: service.thumbnailUrl,
      ownerId: service.ownerId,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
    };
  }
}
