import { CreateHolidayDto } from './entities/create-holiday.dto';
import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { AgendaConfig } from './entities/agenda-config.entity';
import { Holiday } from './entities/holiday.entity';
import { User } from 'src/user/entities/user.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAgendaConfigDto } from './dto/update-agenda-config.dto';
import { BookAppointmentDto } from './dto/book-appointment.dto';
import { addMinutes, format, isBefore } from 'date-fns';

@Injectable()
export class AgendaService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,

    @InjectRepository(AgendaConfig)
    private readonly agendaConfigRepo: Repository<AgendaConfig>,

    @InjectRepository(Holiday)
    private readonly holidayRepo: Repository<Holiday>,
  ) {}

  // Crear cita
  async create(dto: CreateAppointmentDto, user: User) {
    const appointment = this.appointmentRepo.create({
      ...dto,
      date: new Date(dto.date),
      user,
      status: 'pending',
    });
    return this.appointmentRepo.save(appointment);
  }

  // Book automático desde frontend
  async book(dto: BookAppointmentDto, user: User) {
    const userId = user.id;
    const datetime = new Date(`${dto.date}T${dto.time}`);
    const config = await this.agendaConfigRepo.findOne({ where: { user: { id: userId } } });

    if (!config) throw new BadRequestException('No hay configuración de agenda');

    const day = datetime.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const isWorkingDay = config.workingDays.includes(day);

    const isHoliday = await this.holidayRepo.findOne({ where: { user: { id: userId }, date: dto.date } });
    if ((!isWorkingDay || isHoliday) && !config.allowBookingOnBlockedDays) {
      throw new BadRequestException('Día no habilitado para turnos');
    }

    const hour = dto.time;
    if (hour < config.startTime || hour >= config.endTime) {
      throw new BadRequestException('Hora fuera del horario configurado');
    }

    const overlapping = await this.appointmentRepo.findOne({ where: { user: { id: userId }, date: datetime } });
    if (overlapping && !config.overbookingAllowed) {
      throw new BadRequestException('Ya hay un turno en ese horario');
    }

    const appointment = this.appointmentRepo.create({
      title: dto.title,
      description: dto.description,
      date: datetime,
      user,
      status: 'pending',
    });

    return this.appointmentRepo.save(appointment);
  }

  // Slots disponibles
  async getAvailableSlots(date: string, userId: number) {
    const config = await this.agendaConfigRepo.findOne({ where: { user: { id: userId } } });
    if (!config) throw new BadRequestException('No hay configuración');

    const workingDay = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const isWorkingDay = config.workingDays.includes(workingDay);

    const isHoliday = await this.holidayRepo.findOne({ where: { user: { id: userId }, date } });
    if ((!isWorkingDay || isHoliday) && !config.allowBookingOnBlockedDays) {
      return { date, slots: [], message: 'Día bloqueado' };
    }

    const existing = await this.appointmentRepo.find({ where: { user: { id: userId }, date: new Date(date) } });

    const slots = [];
    let currentTime = new Date(`${date}T${config.startTime}`);
    const endTime = new Date(`${date}T${config.endTime}`);

    while (isBefore(currentTime, endTime)) {
      const timeStr = format(currentTime, 'HH:mm');
      const isTaken = existing.some(appt => format(appt.date, 'HH:mm') === timeStr);

      slots.push({
        time: timeStr,
        available: config.overbookingAllowed ? true : !isTaken,
      });

      currentTime = addMinutes(currentTime, config.slotDuration);
    }

    return { date, slots };
  }

  // Obtener citas por fecha / rango / estado
  async getAppointments(
    filter: { date?: string; from?: string; to?: string; status?: string },
    userId: number
  ) {
    const query = this.appointmentRepo.createQueryBuilder('appointment')
      .where('appointment.userId = :userId', { userId });

    if (filter.date) {
      query.andWhere('DATE(appointment.date) = :date', { date: filter.date });
    } else if (filter.from && filter.to) {
      query.andWhere('DATE(appointment.date) BETWEEN :from AND :to', {
        from: filter.from,
        to: filter.to,
      });
    }

    if (filter.status) {
      query.andWhere('appointment.status = :status', { status: filter.status });
    }

    return query.orderBy('appointment.date', 'ASC').getMany();
  }

  // Configuración
  async getConfig(userId: number) {
    const config = await this.agendaConfigRepo.findOne({ where: { user: { id: userId } } });
    return config || null;
  }

  async updateConfig(userId: number, dto: UpdateAgendaConfigDto) {
    let config = await this.agendaConfigRepo.findOne({ where: { user: { id: userId } } });

    if (!config) {
      config = this.agendaConfigRepo.create({ ...dto, user: { id: userId } });
    } else {
      Object.assign(config, dto);
    }

    return this.agendaConfigRepo.save(config);
  }

  // Feriados
  async addHoliday(dto: CreateHolidayDto, userId: number) {
    const exists = await this.holidayRepo.findOne({ where: { user: { id: userId }, date: dto.date } });
    if (exists) throw new BadRequestException('Ya existe un feriado en esa fecha');

    const holiday = this.holidayRepo.create({ ...dto, user: { id: userId } });
    return this.holidayRepo.save(holiday);
  }

  async getHolidays(userId: number) {
    return this.holidayRepo.find({ where: { user: { id: userId } }, order: { date: 'ASC' } });
  }

  // Resumen de citas
  async getSummary(userId: number, from: string, to: string) {
    const appointments = await this.appointmentRepo.find({
      where: {
        user: { id: userId },
        date: Between(new Date(from), new Date(to)),
      },
    });

    const byStatus: Record<string, number> = {};
    const byDate: Record<string, number> = {};
    let total = 0;

    for (const appt of appointments) {
      total++;
      byStatus[appt.status] = (byStatus[appt.status] || 0) + 1;
      const day = format(appt.date, 'yyyy-MM-dd');
      byDate[day] = (byDate[day] || 0) + 1;
    }

    return { total, byStatus, byDate };
  }
}
