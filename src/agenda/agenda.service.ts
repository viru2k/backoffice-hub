import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { Repository } from 'typeorm';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class AgendaService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
  ) {}

  async create(dto: CreateAppointmentDto, user: User) {
    const appointment = this.appointmentRepo.create({
      ...dto,
      date: new Date(dto.date),
      user,
    });
    return this.appointmentRepo.save(appointment);
  }

  async findAll(user: User) {
    return this.appointmentRepo.find({ where: { user: { id: user.id } } });
  }
}
