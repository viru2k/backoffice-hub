import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { Repository } from 'typeorm';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { User } from 'src/user/entities/user.entity';
import { VALID_STATUS_TRANSITIONS } from './constants/status-transition-map';
import { UpdateAgendaConfigDto } from './dto/update-agenda-config.dto';
import { AgendaConfig } from './entities/agenda-config.entity';
import { Holiday } from './entities/holiday.entity';
import { CreateHolidayDto } from './entities/create-holiday.dto';

@Injectable()
export class AgendaService {

  
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(AgendaConfig) 
    private readonly agendaConfigRepo: Repository<AgendaConfig>,
    @InjectRepository(Holiday)     private readonly holidayRepo: Repository<Holiday>,
  ) {}

  async create(dto: CreateAppointmentDto, user: User) {
    const userId = user.id;
    const date = new Date(dto.date);
    const hour = date.toTimeString().slice(0, 5); // 'HH:MM'
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(); // 'monday'
  
    const config = await this.agendaConfigRepo.findOne({ where: { user: { id: userId } } });
    if (!config) throw new BadRequestException('No hay configuración de agenda');
  
    // Validar día laboral
    if (!config.workingDays.includes(dayName)) {
      if (!config.allowBookingOnBlockedDays) {
        throw new BadRequestException(`No se permiten turnos los días no laborales (${dayName})`);
      }
    }
  
    // Validar si es feriado
    const isHoliday = await this.holidayRepo.findOne({ where: { user: { id: userId }, date: dto.date.slice(0, 10) } });
    if (isHoliday && !config.allowBookingOnBlockedDays) {
      throw new BadRequestException('No se permiten turnos en días festivos');
    }
  
    // Validar horario
    if (hour < config.startTime || hour >= config.endTime) {
      throw new BadRequestException(`El turno debe estar entre ${config.startTime} y ${config.endTime}`);
    }
  
    // Validar solapamiento
    const overlapping = await this.appointmentRepo.findOne({
      where: {
        user: { id: userId },
        date: new Date(dto.date),
      },
    });
  
    if (overlapping && !config.overbookingAllowed) {
      throw new BadRequestException('Ya hay un turno asignado para esta hora');
    }
  
    const appointment = this.appointmentRepo.create({
      ...dto,
      date,
      user,
      status: 'pending',
    });
  
    return this.appointmentRepo.save(appointment);
  }

  async updateStatus(appointmentId: number, userId: number, newStatus: AppointmentStatus) {
    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId, user: { id: userId } },
    });
  
    if (!appointment) {
      throw new ForbiddenException('No tienes acceso a esta cita');
    }
  
    const currentStatus = appointment.status;
    const validNextStatuses = VALID_STATUS_TRANSITIONS[currentStatus];
  
    if (!validNextStatuses.includes(newStatus)) {
      throw new BadRequestException(
        `No se puede cambiar de estado "${currentStatus}" a "${newStatus}"`
      );
    }
  
    appointment.status = newStatus;
    return this.appointmentRepo.save(appointment);
  }
  
  

  async findAll(user: User) {
    return this.appointmentRepo.find({
      where: { user: { id: user.id } },
      order: { date: 'ASC' },
    });
  }

  async updateConfig(dto: UpdateAgendaConfigDto, userId: number) {
    const existing = await this.agendaConfigRepo.findOne({ where: { user: { id: userId } } });
  
    if (existing) {
      Object.assign(existing, dto);
      return this.agendaConfigRepo.save(existing);
    }
  
    const newConfig = this.agendaConfigRepo.create({
      ...dto,
      user: { id: userId },
    });
  
    return this.agendaConfigRepo.save(newConfig);
  }
  

  async getConfig(userId: number) {
    const config = await this.agendaConfigRepo.findOne({
      where: { user: { id: userId } },
    });
  
    if (!config) {
      // Podés devolver null o crear una por defecto, según tu lógica
      return {
        message: 'No hay configuración guardada para este usuario',
        config: null,
      };
    }
  
    return config;
  }

  async addHoliday(dto: CreateHolidayDto, userId: number) {
    const exists = await this.holidayRepo.findOne({
      where: { user: { id: userId }, date: dto.date },
    });
  
    if (exists) {
      throw new BadRequestException('Ese día ya está marcado como feriado');
    }
  
    const holiday = this.holidayRepo.create({
      ...dto,
      user: { id: userId },
    });
  
    return this.holidayRepo.save(holiday);
  }
  
  async getHolidays(userId: number) {
    return this.holidayRepo.find({
      where: { user: { id: userId } },
      order: { date: 'ASC' },
    });
  }
  
  
}
