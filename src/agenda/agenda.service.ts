import { CreateHolidayDto } from './entities/create-holiday.dto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository, IsNull, Not, FindOptionsWhere, In } from 'typeorm'; // Añadir FindOptionsWhere e In
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { AgendaConfig } from './entities/agenda-config.entity';
import { Holiday } from './entities/holiday.entity';
import { DayOverride } from './entities/day-override.entity';
import { User } from '../user/entities/user.entity';
import { Client } from '../client/entities/client.entity'; // Asegúrate de importar Client
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAgendaConfigDto } from './dto/update-agenda-config.dto';
import { BookAppointmentDto } from './dto/book-appointment.dto';
import { BlockDatesDto } from './dto/block-dates.dto';
import { BulkConfigUpdateDto } from './dto/bulk-config-update.dto';
import { DayOverrideDto } from './dto/day-override.dto';
import { addMinutes, format, isBefore, parseISO } from 'date-fns'; // Importar parseISO
import { RegisterProductsUsedDto } from './dto/register-products-used.dto';
import { Product } from '../product/entities/product.entity';
import { AppointmentProductLog } from './entities/appointment-product-log.entity';
import { StockMovement } from '../stock/entities/stock-movement.entity';
import { UpdateAppointmentDto } from './dto/update-appointment.dto'; // Importar UpdateAppointmentDto
import { STATUS_COLORS } from './constants/colors';
import { Service } from './entities/service.entity';
import { Room } from './entities/room.entity';
import { DataSource } from 'typeorm';

const STATUS_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  [AppointmentStatus.PENDING]: [AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
  [AppointmentStatus.CONFIRMED]: [AppointmentStatus.CHECKED_IN, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
  [AppointmentStatus.CHECKED_IN]: [AppointmentStatus.IN_PROGRESS, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
  [AppointmentStatus.IN_PROGRESS]: [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED],
  [AppointmentStatus.COMPLETED]: [], // No further transitions after completed
  [AppointmentStatus.CANCELLED]: [], // No further transitions after cancelled
  [AppointmentStatus.NO_SHOW]: [], // No further transitions after no-show
  [AppointmentStatus.RESCHEDULED]: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED], // Can be rescheduled to pending or confirmed
};


@Injectable()
export class AgendaService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(AgendaConfig)
    private readonly agendaConfigRepo: Repository<AgendaConfig>,
    @InjectRepository(Holiday)
    private readonly holidayRepo: Repository<Holiday>,
    @InjectRepository(DayOverride)
    private readonly dayOverrideRepo: Repository<DayOverride>,
    @InjectRepository(User) // Necesario para buscar el profesional
    private readonly userRepo: Repository<User>,
    @InjectRepository(Client) // Necesario para buscar el cliente
    private readonly clientRepo: Repository<Client>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(AppointmentProductLog)
    private readonly productLogRepo: Repository<AppointmentProductLog>,
    @InjectRepository(StockMovement)
    private readonly stockRepo: Repository<StockMovement>,
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
    @InjectRepository(Room)
    private readonly roomRepo: Repository<Room>,
  ) {}

  private async getDefaultSlotDuration(userId: number): Promise<number> {
    const config = await this.agendaConfigRepo.findOne({ where: { user: { id: userId } } }); // CORREGIDO
    return config?.slotDuration || 30; // Default 30 minutos si no hay config
  }

  private async getDefaultService(ownerId: number): Promise<number | undefined> {
    // Buscar servicio por defecto con nombre "Consulta General" o similar
    const defaultService = await this.serviceRepo.findOne({ 
      where: { 
        owner: { id: ownerId },
        name: 'Consulta General'
      } 
    });
    return defaultService?.id;
  }

  private async getDefaultRoom(ownerId: number): Promise<number | undefined> {
    // Buscar sala por defecto con nombre que indique "General" o similar
    const defaultRoom = await this.roomRepo.findOne({ 
      where: { 
        owner: { id: ownerId },
        name: 'Espacio General'
      } 
    });
    if (defaultRoom) return defaultRoom.id;

    // Si no existe "Espacio General", buscar "Consultorio General"
    const generalRoom = await this.roomRepo.findOne({ 
      where: { 
        owner: { id: ownerId },
        name: 'Consultorio General'
      } 
    });
    return generalRoom?.id;
  }

  // Crear cita
  async create(dto: CreateAppointmentDto, currentUser: User): Promise<Appointment> {
    const {
      title,
      startDateTime,
      endDateTime,
      notes,
      allDay = false, // Valor por defecto
      clientId,
      professionalId, // ID del usuario profesional
      status = 'pending', // Valor por defecto
      serviceId,
      roomId,
    } = dto;

    const appointment = new Appointment();
    appointment.title = title;
    appointment.startDateTime = parseISO(startDateTime); // Convertir string ISO a Date

    // Asignar profesional
    if (professionalId) {
      const professional = await this.userRepo.findOneBy({ id: professionalId });
      if (!professional) {
        throw new NotFoundException(`Profesional con ID ${professionalId} no encontrado.`);
      }
      appointment.professional = professional;
    } else {
      // Si no se provee professionalId, se podría asignar el usuario actual si tiene sentido en tu lógica
      // o dejarlo nulo si la entidad lo permite y es un turno "general" de la cuenta.
      // Por ahora, si professionalId es opcional en el DTO, y la entidad lo permite, puede ser nulo.
      // Si siempre debe haber un profesional, professionalId debería ser obligatorio.
      // Asumamos que si no se especifica, puede ser el usuario que crea el turno (dueño de la agenda)
       appointment.professional = currentUser; // O manejar según tu lógica de negocio
    }
    
    // Calcular endDateTime si no se provee, usando slotDuration del profesional asignado
    if (!endDateTime) {
      const duration = await this.getDefaultSlotDuration(appointment.professional.id);
      appointment.endDateTime = addMinutes(appointment.startDateTime, duration);
    } else {
      appointment.endDateTime = parseISO(endDateTime);
    }

    if (appointment.endDateTime <= appointment.startDateTime) {
        throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio.');
    }

    appointment.notes = notes;
    appointment.allDay = allDay;
    appointment.status = dto.status || AppointmentStatus.PENDING;
    appointment.color = STATUS_COLORS[status] || STATUS_COLORS.pending; // Color por defecto
    
    // Asignar servicio (usar por defecto si no se especifica)
    if (serviceId) {
      appointment.serviceId = serviceId;
    } else {
      // Obtener el owner para buscar servicio por defecto
      const ownerId = currentUser.owner?.id || currentUser.id;
      appointment.serviceId = await this.getDefaultService(ownerId);
    }
    
    // Asignar sala (usar por defecto si no se especifica)
    if (roomId) {
      appointment.roomId = roomId;
    } else {
      // Obtener el owner para buscar sala por defecto
      const ownerId = currentUser.owner?.id || currentUser.id;
      appointment.roomId = await this.getDefaultRoom(ownerId);
    }

    // Asignar cliente
    if (clientId) {
      const client = await this.clientRepo.findOneBy({ id: clientId /*, owner: currentUser */ }); // Asegurar que el cliente pertenezca al usuario si es necesario
      if (!client) {
        throw new NotFoundException(`Cliente con ID ${clientId} no encontrado.`);
      }
      appointment.client = client;
    }
    
    // El campo 'user' original en la entidad Appointment se llamaba 'user', ahora es 'professional'.
    // Si necesitas también un "owner" del turno (quién lo creó, que podría ser diferente del profesional),
    // necesitarías otro campo en la entidad Appointment.
    // Por ahora, el 'professional' es el User asignado al turno.

    return this.appointmentRepo.save(appointment);
  }

  // Actualizar cita
  async update(id: number, dto: UpdateAppointmentDto, currentUser: User): Promise<Appointment> {
    const appointment = await this.appointmentRepo.findOne({
        where: { id },
        relations: ['professional', 'client'], // Cargar relaciones para no perderlas
    });

    if (!appointment) {
      throw new NotFoundException(`Turno con ID ${id} no encontrado.`);
    }

    // Validar transición de estado
    if (dto.status && dto.status !== appointment.status) {
      const validTransitions = STATUS_TRANSITIONS[appointment.status];
      if (!validTransitions || !validTransitions.includes(dto.status)) {
        throw new BadRequestException(`Transición de estado inválida de ${appointment.status} a ${dto.status}.`);
      }
      appointment.status = dto.status;
      appointment.color = STATUS_COLORS[dto.status] || appointment.color;
    }

    if (dto.title) appointment.title = dto.title;
    if (dto.startDateTime) appointment.startDateTime = parseISO(dto.startDateTime);
    
    if (dto.endDateTime) {
      appointment.endDateTime = parseISO(dto.endDateTime);
    } else if (dto.startDateTime) { // Si se actualiza startDateTime pero no endDateTime, recalcular end
      const duration = appointment.endDateTime ? 
                       (appointment.endDateTime.getTime() - appointment.startDateTime.getTime()) / (60 * 1000) : // Duración original
                       await this.getDefaultSlotDuration(appointment.professional?.id || currentUser.id); // O default
      appointment.endDateTime = addMinutes(appointment.startDateTime, duration);
    }

    if (appointment.endDateTime && appointment.startDateTime && appointment.endDateTime <= appointment.startDateTime) {
        throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio.');
    }

    if (dto.notes !== undefined) appointment.notes = dto.notes;
    if (dto.allDay !== undefined) appointment.allDay = dto.allDay;
    
    if (dto.status) {
      appointment.status = dto.status;
          appointment.color = STATUS_COLORS[dto.status] || appointment.color;
    }

    if (dto.serviceId !== undefined) appointment.serviceId = dto.serviceId;
    if (dto.roomId !== undefined) appointment.roomId = dto.roomId;

    if (dto.clientId !== undefined) {
      if (dto.clientId === null) { // Permitir desasociar cliente
        appointment.client = null;
      } else {
        const client = await this.clientRepo.findOneBy({ id: dto.clientId });
        if (!client) throw new NotFoundException(`Cliente con ID ${dto.clientId} no encontrado.`);
        appointment.client = client;
      }
    }

    if (dto.professionalId !== undefined) {
       if (dto.professionalId === null) { // Permitir desasociar profesional
        appointment.professional = null;
      } else {
        const professional = await this.userRepo.findOneBy({ id: dto.professionalId });
        if (!professional) throw new NotFoundException(`Profesional con ID ${dto.professionalId} no encontrado.`);
        appointment.professional = professional;
      }
    }
    
    return this.appointmentRepo.save(appointment);
  }


  // Book automático desde frontend (adaptar)
  async book(dto: BookAppointmentDto, userMakingBooking: User): Promise<Appointment> { 
    return this.dataSource.transaction(async (manager) => {
      const professionalUserId = dto.professionalId || userMakingBooking.id; 
      
      const config = await manager.findOne(AgendaConfig, { where: { user: { id: professionalUserId } } });
      if (!config) throw new BadRequestException('No hay configuración de agenda para este profesional.');

      const startDateTime = parseISO(`${dto.date}T${dto.time}`); 

      // Validaciones (día laboral, feriado, horario)
      const dayOfWeek = startDateTime.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      if (!config.workingDays.includes(dayOfWeek) && !config.allowBookingOnBlockedDays) {
        throw new BadRequestException('Día no habilitado para turnos.');
      }
      const isHoliday = await manager.findOne(Holiday, { where: { date: dto.date, user: { id: professionalUserId } } });
      if (isHoliday && !config.allowBookingOnBlockedDays) {
        throw new BadRequestException('El día es feriado y no se permiten reservas.');
      }
      
      const timeStr = format(startDateTime, 'HH:mm');
      if (timeStr < config.startTime || timeStr >= config.endTime) {
        throw new BadRequestException('Hora fuera del horario configurado para el profesional.');
      }

      // Calcular endDateTime
      const endDateTime = addMinutes(startDateTime, config.slotDuration);

      // Verificar solapamientos
      const overlapping = await manager.createQueryBuilder(Appointment, "appointment")
        .where("appointment.professionalId = :professionalUserId", { professionalUserId })
        .andWhere("((appointment.startDateTime < :endDateTime) AND (appointment.endDateTime > :startDateTime))", {
            startDateTime,
            endDateTime,
        })
        .getCount();

      if (overlapping > 0 && !config.overbookingAllowed) {
        throw new BadRequestException('Ya hay un turno en ese horario para el profesional.');
      }

      const newAppointment = manager.create(Appointment, {
        title: dto.title,
        description: dto.description,
        startDateTime,
        endDateTime,
        professional: { id: professionalUserId } as User, 
        status: AppointmentStatus.CONFIRMED,
        color: STATUS_COLORS.confirmed, 
        allDay: false, 
      });

      if (dto.clientId) {
        const client = await manager.findOne(Client, { where: { id: dto.clientId } });
        if (!client) throw new NotFoundException(`Cliente con ID ${dto.clientId} no encontrado.`);
        newAppointment.client = client;
      }

      return manager.save(Appointment, newAppointment);
    });
  }

  // Slots disponibles (adaptar)
async getAvailableSlots(date: string, professionalUserId: number) {
    const config = await this.agendaConfigRepo.findOne({ where: { user: { id: professionalUserId } } }); 
    if (!config) throw new BadRequestException('No hay configuración de agenda para el profesional.');

    const targetDate = parseISO(date);
    const workingDay = targetDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    if (!config.workingDays.map(day => day.toLowerCase()).includes(workingDay) && !config.allowBookingOnBlockedDays) {
      return { date, slots: [], message: 'Día no laboral para el profesional.' };
    }

    const holiday = await this.holidayRepo.findOne({ where: { date: format(targetDate, 'yyyy-MM-dd'), user: { id: professionalUserId } } }); 
    if (holiday && !config.allowBookingOnBlockedDays) {
      return { date, slots: [], message: 'Día feriado no disponible para reservas.' };
    }

    const dayStart = parseISO(`${date}T00:00:00.000Z`);
    const dayEnd = parseISO(`${date}T23:59:59.999Z`);

    const existingAppointments = await this.appointmentRepo.find({
      where: {
        professional: { id: professionalUserId },
        startDateTime: Between(dayStart, dayEnd),
      },
      order: { startDateTime: 'ASC' },
    });

    const slots = [];
    let currentTime = parseISO(`${date}T${config.startTime}`);
    const endTime = parseISO(`${date}T${config.endTime}`);

    while (isBefore(currentTime, endTime)) {
      const slotEnd = addMinutes(currentTime, config.slotDuration);
      const timeStr = format(currentTime, 'HH:mm');
      
      let isTaken = false;
      if (!config.overbookingAllowed) {
        isTaken = existingAppointments.some(appt => 
          (currentTime >= appt.startDateTime && currentTime < appt.endDateTime) ||
          (slotEnd > appt.startDateTime && slotEnd <= appt.endDateTime) ||
          (currentTime <= appt.startDateTime && slotEnd >= appt.endDateTime)
        );
      }

      slots.push({
        time: timeStr,
        start: currentTime.toISOString(),
        end: slotEnd.toISOString(),
        available: !isTaken,
      });
      currentTime = slotEnd;
    }
    return { date, slots };
  }

  // Obtener citas (adaptar)
  async getAppointments(
    filter: { date?: string; from?: string; to?: string; status?: AppointmentStatus | AppointmentStatus[], professionalId?: number, professionalIds?: number[] },
    requestingUserId: number // El ID del usuario que realiza la petición
  ): Promise<Appointment[]> {
    const queryOptions: FindOptionsWhere<Appointment> = {};

    // Manejar professionalIds (array) o professionalId (single) 
    if (filter.professionalIds && filter.professionalIds.length > 0) {
      // Usar array de IDs
      if (filter.professionalIds.length === 1) {
        queryOptions.professional = { id: filter.professionalIds[0] };
      } else {
        queryOptions.professional = { id: In(filter.professionalIds) };
      }
    } else if (filter.professionalId) {
      // Compatibilidad hacia atrás con professionalId único
      queryOptions.professional = { id: filter.professionalId };
    } else {
      // Por defecto, mostrar los turnos del usuario que hace la petición
      queryOptions.professional = { id: requestingUserId };
    }

    if (filter.date) {
      const dayStart = parseISO(`${filter.date}T00:00:00.000Z`);
      const dayEnd = parseISO(`${filter.date}T23:59:59.999Z`);
      queryOptions.startDateTime = Between(dayStart, dayEnd);
    } else if (filter.from && filter.to) {
      queryOptions.startDateTime = Between(parseISO(filter.from), parseISO(filter.to));
    }

    // Manejar status como array o valor único
    if (filter.status) {
      if (Array.isArray(filter.status)) {
        if (filter.status.length === 1) {
          queryOptions.status = filter.status[0];
        } else if (filter.status.length > 1) {
          queryOptions.status = In(filter.status);
        }
      } else {
        queryOptions.status = filter.status;
      }
    }

    return this.appointmentRepo.find({ 
        where: queryOptions, 
        order: { startDateTime: 'ASC' },
        relations: ['professional', 'client'] // Cargar relaciones para el DTO
    });
  }

  // Configuración de agenda (adaptar 'user' a 'professional')
  async getConfig(professionalUserId: number): Promise<AgendaConfig | null> { // Ahora usa professionalUserId
    const config = await this.agendaConfigRepo.findOne({ where: { user: { id: professionalUserId } } }); // CORREGIDO
  return config || null;
  }

  async updateConfig(professionalUserId: number, dto: UpdateAgendaConfigDto): Promise<AgendaConfig> { // Ahora usa professionalUserId
    let config = await this.agendaConfigRepo.findOne({ where: { user: { id: professionalUserId } } });

   if (!config) {
    const professionalUser = await this.userRepo.findOneBy({ id: professionalUserId }); // Buscamos el User
    if (!professionalUser) throw new NotFoundException('Profesional no encontrado para crear configuración de agenda.');
    config = this.agendaConfigRepo.create({ ...dto, user: professionalUser }); 
  } else {
      Object.assign(config, dto);
    }
    return this.agendaConfigRepo.save(config);
  }

  // Feriados (adaptar 'user' a 'professional')
async addHoliday(dto: CreateHolidayDto, professionalUserId: number): Promise<Holiday> {
  const professionalUser = await this.userRepo.findOneBy({id: professionalUserId}); // Buscamos el User
  if(!professionalUser) throw new NotFoundException(`Profesional con ID ${professionalUserId} no encontrado.`);
  const exists = await this.holidayRepo.findOne({ where: { user: { id: professionalUserId }, date: dto.date } });
  if (exists) throw new BadRequestException('Ya existe un feriado en esa fecha para este profesional.')
  const holiday = this.holidayRepo.create({ ...dto, user: professionalUser }); 
  return this.holidayRepo.save(holiday);
}

  async getHolidays(professionalUserId: number): Promise<Holiday[]> { // Ahora usa professionalUserId
    return this.holidayRepo.find({ 
      where: { user: { id: professionalUserId } }, 
      relations: ['user'],
      order: { date: 'ASC' } 
    });
  }

  // Resumen de citas (adaptar)
  async getSummary(professionalUserIds: number[], from: string, to: string) {
    const appointments = await this.appointmentRepo.find({
      where: {
        professional: { id: In(professionalUserIds) },
        startDateTime: Between(parseISO(from), parseISO(to)),
      },
    });

    const byStatus: Record<string, number> = {};
    const byDate: Record<string, number> = {};
    let total = 0;

    for (const appt of appointments) {
      total++;
      byStatus[appt.status] = (byStatus[appt.status] || 0) + 1;
      const day = format(appt.startDateTime, 'yyyy-MM-dd');
      byDate[day] = (byDate[day] || 0) + 1;
    }
    return { total, byStatus, byDate };
  }

  // Métodos de productos usados (sin cambios mayores aquí, solo asegurar que 'user' en la cita sea el profesional correcto)
  async registerProductsUsed(
    appointmentId: number,
    dto: RegisterProductsUsedDto,
    currentUser: User, // Usuario que registra la acción (puede ser admin o el profesional)
  ) {
    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
      relations: ['professional'] // Cargar profesional para validación si es necesario
    });
  
    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    // Opcional: Validar que currentUser tenga permiso (ej. es el profesional del turno o admin)
    // if (appointment.professional.id !== currentUser.id && !currentUser.isAdmin) {
    //   throw new ForbiddenException('No tienes permiso para registrar productos en esta cita.');
    // }
  
    for (const item of dto.products) {
      // Asumimos que los productos pertenecen al 'owner' de la agenda/cuenta (profesional principal)
      // o que el producto es accesible por el profesional que está usando el producto.
      // Esta lógica de pertenencia del producto podría necesitar ajustarse.
      const productOwnerId = appointment.professional?.id || currentUser.id; // Ajustar según tu lógica de propiedad de productos
      const product = await this.productRepo.findOne({
        where: { id: item.productId, owner: { id: productOwnerId } },
      });
  
      if (!product) {
        throw new NotFoundException(`Producto ID ${item.productId} no encontrado o no pertenece al usuario.`);
      }
  
      await this.productLogRepo.save({
        appointment,
        product,
        quantity: item.quantity,
        priceAtTime: product.currentPrice,
        // usedAt es @CreateDateColumn
      });
  
      await this.stockRepo.save({
        product,
        productNameAtTime: product.name,
        quantity: item.quantity,
        type: 'usage', // Tipo de movimiento de stock
        reason: `Uso en cita ID ${appointmentId}`,
        user: appointment.professional || currentUser, // El usuario que "usa" el stock (el profesional del turno o quien registra)
        date: new Date(), // Fecha del movimiento de stock
      });
    }
    return { message: 'Productos registrados correctamente' };
  }

  async getProductsUsedByAppointment(appointmentId: number, requestingUserId: number): Promise<AppointmentProductLog[]> {
    // Validar que el requestingUserId tenga permiso para ver esto, ej:
    // const appointment = await this.appointmentRepo.findOne({ where: { id: appointmentId, professional: { id: requestingUserId } }});
    // if (!appointment) throw new NotFoundException('Cita no encontrada o no tienes acceso.');

    return this.productLogRepo.find({
      where: { appointment: { id: appointmentId } },
      relations: ['product'],
      order: { usedAt: 'DESC' },
    });
  }

  // Métodos para gestión avanzada de agenda

  async blockMultipleDates(dto: BlockDatesDto, userId: number): Promise<number> {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    let blockedCount = 0;
    for (const date of dto.dates) {
      // Verificar si ya existe un holiday para esa fecha
      const existingHoliday = await this.holidayRepo.findOne({
        where: { date, user: { id: userId } }
      });

      if (!existingHoliday) {
        await this.holidayRepo.save({
          date,
          reason: dto.reason || 'Día bloqueado',
          user
        });
        blockedCount++;
      }
    }

    return blockedCount;
  }

  async unblockDates(dates: string[], userId: number): Promise<number> {
    if (dates.length === 0) return 0;

    const result = await this.holidayRepo.delete({
      date: In(dates),
      user: { id: userId }
    });

    return result.affected || 0;
  }

  async createDayOverride(dto: DayOverrideDto, userId: number): Promise<DayOverride> {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // Verificar si ya existe un override para esa fecha
    const existing = await this.dayOverrideRepo.findOne({
      where: { date: dto.date, user: { id: userId } }
    });

    if (existing) {
      // Actualizar el existente
      Object.assign(existing, dto);
      return this.dayOverrideRepo.save(existing);
    }

    // Crear nuevo override
    const override = this.dayOverrideRepo.create({
      ...dto,
      user
    });

    return this.dayOverrideRepo.save(override);
  }

  async getDayOverrides(userId: number, from?: string, to?: string): Promise<DayOverride[]> {
    const where: any = { user: { id: userId } };

    if (from && to) {
      where.date = Between(from, to);
    } else if (from) {
      // Solo fecha desde
      where.date = from;
    }

    return this.dayOverrideRepo.find({
      where,
      order: { date: 'ASC' }
    });
  }

  async bulkConfigUpdate(dto: BulkConfigUpdateDto, userId: number): Promise<number> {
    const [fromDate, toDate] = dto.dateRange;
    if (!fromDate || !toDate) {
      throw new BadRequestException('dateRange debe contener exactamente 2 fechas [from, to]');
    }

    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // Para simplificar, creamos overrides para cada día en el rango
    // En una implementación más compleja, podríamos tener una tabla separada para configuraciones por rango
    const start = new Date(fromDate);
    const end = new Date(toDate);
    let affectedDays = 0;

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Verificar si es un día laboral según workingDays
      if (dto.workingDays) {
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        if (!dto.workingDays.includes(dayOfWeek)) {
          continue; // Saltar días no laborables
        }
      }

      await this.dayOverrideRepo.upsert({
        date: dateStr,
        user,
        startTime: dto.startTime,
        endTime: dto.endTime,
        slotDuration: dto.slotDuration,
        blocked: false,
        note: 'Configuración masiva aplicada'
      }, ['date', 'user']);

      affectedDays++;
    }

    return affectedDays;
  }

  async getAvailabilityRange(userId: number, from: string, to: string): Promise<any> {
    const config = await this.agendaConfigRepo.findOne({ where: { user: { id: userId } } });
    if (!config) {
      throw new NotFoundException('No hay configuración de agenda para este usuario');
    }

    const start = new Date(from);
    const end = new Date(to);
    const availability: any[] = [];

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Verificar si es día laborable
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const isWorkingDay = config.workingDays.map(d => d.toLowerCase()).includes(dayOfWeek);

      // Verificar holidays
      const holiday = await this.holidayRepo.findOne({
        where: { date: dateStr, user: { id: userId } }
      });

      // Verificar overrides
      const override = await this.dayOverrideRepo.findOne({
        where: { date: dateStr, user: { id: userId } }
      });

      // Obtener slots disponibles para este día
      let dayAvailability: any = {
        date: dateStr,
        isWorkingDay,
        isHoliday: !!holiday,
        isBlocked: override?.blocked || false,
        holidayReason: holiday?.reason,
        override: override ? {
          startTime: override.startTime,
          endTime: override.endTime,
          slotDuration: override.slotDuration,
          note: override.note
        } : null
      };

      if (isWorkingDay && !holiday && !override?.blocked) {
        // Calcular slots disponibles
        const slots = await this.getAvailableSlots(dateStr, userId);
        dayAvailability.slots = slots.slots;
        dayAvailability.availableSlots = slots.slots?.filter(slot => slot.available).length || 0;
        dayAvailability.totalSlots = slots.slots?.length || 0;
      } else {
        dayAvailability.slots = [];
        dayAvailability.availableSlots = 0;
        dayAvailability.totalSlots = 0;
      }

      availability.push(dayAvailability);
    }

    return {
      from,
      to,
      totalDays: availability.length,
      workingDays: availability.filter(d => d.isWorkingDay && !d.isHoliday && !d.isBlocked).length,
      blockedDays: availability.filter(d => d.isHoliday || d.isBlocked).length,
      days: availability
    };
  }
}