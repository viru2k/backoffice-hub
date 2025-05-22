import { CreateHolidayDto } from './entities/create-holiday.dto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository, IsNull, Not, FindOptionsWhere } from 'typeorm'; // Añadir FindOptionsWhere
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { AgendaConfig } from './entities/agenda-config.entity';
import { Holiday } from './entities/holiday.entity';
import { User } from '../user/entities/user.entity';
import { Client } from '../client/entities/client.entity'; // Asegúrate de importar Client
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAgendaConfigDto } from './dto/update-agenda-config.dto';
import { BookAppointmentDto } from './dto/book-appointment.dto';
import { addMinutes, format, isBefore, parseISO } from 'date-fns'; // Importar parseISO
import { RegisterProductsUsedDto } from './dto/register-products-used.dto';
import { Product } from '../product/entities/product.entity';
import { AppointmentProductLog } from './entities/appointment-product-log.entity';
import { StockMovement } from '../stock/entities/stock-movement.entity';
import { UpdateAppointmentDto } from './dto/update-appointment.dto'; // Importar UpdateAppointmentDto
import { STATUS_COLORS } from './constants/colors';


@Injectable()
export class AgendaService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(AgendaConfig)
    private readonly agendaConfigRepo: Repository<AgendaConfig>,
    @InjectRepository(Holiday)
    private readonly holidayRepo: Repository<Holiday>,
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
  ) {}

  private async getDefaultSlotDuration(userId: number): Promise<number> {
    const config = await this.agendaConfigRepo.findOne({ where: { user: { id: userId } } }); // CORREGIDO
  return config?.slotDuration || 30; // Default 30 minutos si no hay config
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
    appointment.serviceId = serviceId;
    appointment.roomId = roomId;

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

    // Validar que el currentUser tenga permisos para modificar este turno
    // (ej. si es el profesional asignado, o el dueño de la agenda/cuenta)
    // Esta lógica de autorización puede ser más compleja y residir en un Guard o aquí.
    // Por ahora, asumimos que si lo encuentra, puede modificarlo (simplificación).

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
    const professionalUserId = userMakingBooking.id; // Asumimos que el profesional es el usuario actual por defecto para el 'book' simplificado.
                                          // Si el 'book' es para otro profesional, el DTO necesitaría un professionalId.
    
   const config = await this.agendaConfigRepo.findOne({ where: { user: { id: professionalUserId } } });// Cambiado de user a professional
    if (!config) throw new BadRequestException('No hay configuración de agenda para este profesional.');

    const startDateTime = parseISO(`${dto.date}T${dto.time}`); // Ejemplo: "2025-05-15T08:15:00"

    // Validaciones (día laboral, feriado, horario)
    const dayOfWeek = startDateTime.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    if (!config.workingDays.includes(dayOfWeek) && !config.allowBookingOnBlockedDays) {
      throw new BadRequestException('Día no habilitado para turnos.');
    }
const isHoliday = await this.holidayRepo.findOne({ where: { date: dto.date, user: { id: professionalUserId } } });     // Filtrar por profesional

    if (isHoliday && !config.allowBookingOnBlockedDays) {
      throw new BadRequestException('El día es feriado y no se permiten reservas.');
    }
    
    const timeStr = format(startDateTime, 'HH:mm');
    if (timeStr < config.startTime || timeStr >= config.endTime) {
      throw new BadRequestException('Hora fuera del horario configurado para el profesional.');
    }

    // Calcular endDateTime
    const endDateTime = addMinutes(startDateTime, config.slotDuration);

    // Verificar solapamientos (simplificado, podría necesitar lógica más compleja para rangos)
    const overlapping = await this.appointmentRepo
      .createQueryBuilder("appointment")
      .where("appointment.professionalId = :professionalUserId", { professionalUserId })
      .andWhere("((appointment.startDateTime < :endDateTime) AND (appointment.endDateTime > :startDateTime))", {
          startDateTime,
          endDateTime,
      })
      .getCount();

    if (overlapping > 0 && !config.overbookingAllowed) {
      throw new BadRequestException('Ya hay un turno en ese horario para el profesional.');
    }

    const newAppointment = this.appointmentRepo.create({
      title: dto.title,
      description: dto.description, // Asumiendo que BookAppointmentDto también puede tener description
      startDateTime,
      endDateTime,
      professional: { id: professionalUserId } as User, // Asignar el profesional
      status: AppointmentStatus.CONFIRMED,// O 'pending' si requiere confirmación
      color: STATUS_COLORS.confirmed, // Color por defecto para confirmado
      allDay: false, // Asumir que no es de día completo por defecto para 'book'
      // clientId podría venir del DTO si el usuario que reserva es un cliente logueado
      // o si el profesional lo selecciona al crear.
    });

    return this.appointmentRepo.save(newAppointment);
  }

  // Slots disponibles (adaptar)
async getAvailableSlots(date: string, professionalUserId: number) {
    const config = await this.agendaConfigRepo.findOne({ where: { user: { id: professionalUserId } } }); 
    if (!config) throw new BadRequestException('No hay configuración de agenda para el profesional.');

    const targetDate = parseISO(date);
    const workingDay = targetDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    if (!config.workingDays.includes(workingDay) && !config.allowBookingOnBlockedDays) {
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
    filter: { date?: string; from?: string; to?: string; status?: AppointmentStatus, professionalId?: number },
    requestingUserId: number // El ID del usuario que realiza la petición
  ): Promise<Appointment[]> {
    const queryOptions: FindOptionsWhere<Appointment> = {};

    // Por defecto, si no se especifica professionalId en el filtro,
    // se muestran los turnos del profesional que hace la solicitud.
    // O podrías requerir siempre un professionalId si es para un admin viendo agendas de otros.
    const targetProfessionalId = filter.professionalId || requestingUserId;
    queryOptions.professional = { id: targetProfessionalId };


    if (filter.date) {
      const dayStart = parseISO(`${filter.date}T00:00:00.000Z`);
      const dayEnd = parseISO(`${filter.date}T23:59:59.999Z`);
      queryOptions.startDateTime = Between(dayStart, dayEnd);
    } else if (filter.from && filter.to) {
      queryOptions.startDateTime = Between(parseISO(filter.from), parseISO(filter.to));
    }

    if (filter.status) {
      queryOptions.status = filter.status;
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
    return this.holidayRepo.find({ where: { user: { id: professionalUserId } }, order: { date: 'ASC' } });
  }

  // Resumen de citas (adaptar)
  async getSummary(professionalUserId: number, from: string, to: string) { // Ahora usa professionalUserId
    const appointments = await this.appointmentRepo.find({
      where: {
        professional: { id: professionalUserId },
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
}