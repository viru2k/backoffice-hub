import {
  Body,
  Controller,
  Get,
  Param,
  Patch, 
  Post,
  Delete, 
  Query,
  Request,
  UseGuards,
  ParseIntPipe, // Para convertir parámetros de ruta a números
  HttpStatus,
  ForbiddenException,   // Para códigos de estado HTTP
} from '@nestjs/common';
import { AgendaService } from './agenda.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { BookAppointmentDto } from './dto/book-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto'; 
import { UpdateAgendaConfigDto } from './dto/update-agenda-config.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import {
  endOfToday,
  endOfWeek,
  startOfToday,
  startOfWeek,
} from 'date-fns';
import { CreateHolidayDto } from './entities/create-holiday.dto'; 
import { RegisterProductsUsedDto } from './dto/register-products-used.dto';

import { AppointmentResponseDto, AppointmentProfessionalResponseDto, AppointmentClientResponseDto } from './dto/appointment-response.dto';
import { AvailableSlotResponseDto } from './dto/available-slot-response.dto';
import { AgendaConfigResponseDto } from './dto/agenda-config-response.dto';
import { HolidayResponseDto } from './dto/holiday-response.dto';
import { AppointmentSummaryResponseDto } from './dto/appointment-summary-response.dto';
import { AppointmentProductLogResponseDto } from './dto/appointment-product-log-response.dto';

import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { STATUS_COLORS } from './constants/colors';
import { UserService } from 'src/user/user.service';
import { PermissionsGuard } from 'src/common/guards/permissions.guard'; 
import { Permissions } from 'src/common/decorators/permissions.decorator';


// Esta función convierte la entidad Appointment a AppointmentResponseDto
function mapAppointmentToResponseDto(appointment: Appointment): AppointmentResponseDto {
  if (!appointment) return null;

  const professionalResponse: AppointmentProfessionalResponseDto = appointment.professional
    ? { id: appointment.professional.id, fullName: appointment.professional.fullName }
    : undefined;

  const clientResponse: AppointmentClientResponseDto = appointment.client
    ? { 
        id: appointment.client.id, 
        fullname: appointment.client.fullname,
        name: appointment.client.name,
        lastName: appointment.client.lastName,
      }
    : undefined;

  return {
    id: appointment.id.toString(), // FullCalendar espera IDs de string
    title: appointment.title || 'Turno sin título',
    start: appointment.startDateTime.toISOString(),
    end: appointment.endDateTime ? appointment.endDateTime.toISOString() : null,
    allDay: appointment.allDay || false,
    color: appointment.color || STATUS_COLORS[appointment.status] || '#3788d8', // Asignar color basado en estado
    status: appointment.status,
    notes: appointment.notes,
    professional: professionalResponse,
    client: clientResponse,
    serviceId: appointment.serviceId,
    roomId: appointment.roomId,
    createdAt: appointment.createdAt.toISOString(),
    updatedAt: appointment.updatedAt.toISOString(),
    extendedProps: {
      resourceId: appointment.professional?.id?.toString() || appointment.roomId?.toString() || undefined,
      originalStatus: appointment.status,
      // Se puede añadir más propiedades aquí si es necesario
       clientId: appointment.client?.id,
       notes: appointment.notes, 
    },
  };
}


@ApiTags('agenda')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('agenda')
export class AgendaController {
  constructor(private readonly agendaService: AgendaService, private readonly userService: UserService) {}

  @Post()
  @Permissions('canManageAgenda')
  @ApiOperation({ summary: 'Crear un turno manual' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Turno creado exitosamente.', type: AppointmentResponseDto })
  async create(@Body() dto: CreateAppointmentDto, @Request() req): Promise<AppointmentResponseDto> {
    const appointmentEntity = await this.agendaService.create(dto, req.user);
    return mapAppointmentToResponseDto(appointmentEntity);
  }

  @Patch(':id') // Ruta para actualizar un turno
  @Permissions('canManageAgenda')
  @ApiOperation({ summary: 'Actualizar un turno existente' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Turno actualizado exitosamente.', type: AppointmentResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Turno no encontrado.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAppointmentDto,
    @Request() req,
  ): Promise<AppointmentResponseDto> {
    const updatedAppointment = await this.agendaService.update(id, dto, req.user);
    return mapAppointmentToResponseDto(updatedAppointment);
  }

  @Post('book')
  @Permissions('canManageAgenda')
  @ApiOperation({ summary: 'Reservar un turno en un slot disponible (cliente o profesional)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Turno reservado exitosamente.', type: AppointmentResponseDto })
  async book(@Body() dto: BookAppointmentDto, @Request() req): Promise<AppointmentResponseDto> {
    // Asumimos que req.user es quien está haciendo la reserva.
    // El servicio `book` podría necesitar lógica para determinar el profesional si no es req.user
    const appointmentEntity = await this.agendaService.book(dto, req.user);
    return mapAppointmentToResponseDto(appointmentEntity);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener turnos por diversos filtros (fecha, rango, estado, profesional)' })
  @ApiQuery({ name: 'date', required: false, type: String, description: 'Fecha específica (YYYY-MM-DD)' })
  @ApiQuery({ name: 'from', required: false, type: String, description: 'Fecha de inicio del rango (YYYY-MM-DD)' })
  @ApiQuery({ name: 'to', required: false, type: String, description: 'Fecha de fin del rango (YYYY-MM-DD)' })
  @ApiQuery({ name: 'status', required: false, enum: AppointmentStatus, description: 'Estado del turno' })
  @ApiQuery({ name: 'professionalId', required: false, type: Number, description: 'ID del profesional para filtrar (admin)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de turnos.', type: [AppointmentResponseDto] })
  async getAppointments(
    @Request() req,
    @Query('date') date?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: AppointmentStatus,
    @Query('professionalId') professionalId?: number, // professionalId como opcional
  ): Promise<AppointmentResponseDto[]> {
      const requestingUser = req.user;
    const targetProfessionalId = professionalId || req.user.id; // Usar el ID del query o el del usuario logueado
    if (targetProfessionalId) {
      if (!requestingUser.isAdmin) {
        throw new ForbiddenException('No tienes permisos para ver la agenda de otros usuarios.');
      }
      const isMember = await this.userService.isUserInAdminGroup(targetProfessionalId, requestingUser.id);
      if (!isMember) {
        throw new ForbiddenException('El usuario especificado no pertenece a su grupo.');
      }
    const appointments = await this.agendaService.getAppointments(
      { date, from, to, status, professionalId: targetProfessionalId }, // Pasar professionalId al servicio
      req.user.id, // requestingUserId, para posible lógica de permisos en el servicio
    );
    return appointments.map(mapAppointmentToResponseDto);
  }

  }

@Get('available')
@ApiOperation({ summary: 'Ver slots disponibles para un día y profesional' })
@ApiQuery({ name: 'date', required: true, type: String, description: 'Fecha para consultar (YYYY-MM-DD)'})
@ApiQuery({ name: 'professionalId', required: false, type: Number, description: 'ID del profesional (si es diferente al logueado)'})
@ApiResponse({ status: HttpStatus.OK, type: AvailableSlotResponseDto }) // El DTO contenedor
async getAvailable(
  @Request() req,
  @Query('date') date: string, 
  @Query('professionalId') professionalIdQuery?: number,
): Promise<AvailableSlotResponseDto> { 
  const targetProfessionalId = professionalIdQuery || req.user.id;
  const requestingUser = req.user;
    const targetUserId = professionalIdQuery || requestingUser.id;
     if (targetUserId !== requestingUser.id) {
      if (!requestingUser.isAdmin) {
        throw new ForbiddenException('No tienes permisos para ver la disponibilidad de otros usuarios.');
      }
      const isMember = await this.userService.isUserInAdminGroup(targetUserId, requestingUser.id);
      if (!isMember) {
        throw new ForbiddenException('El usuario especificado no pertenece a su grupo.');
      }
    }
  // El servicio ya devuelve la estructura correcta que coincide con el DTO contenedor.
  return this.agendaService.getAvailableSlots(date, targetProfessionalId);
}

  @Get('config')
  @ApiOperation({ summary: 'Obtener configuración de agenda del profesional actual (o especificado)' })
  @ApiQuery({ name: 'professionalId', required: false, type: Number, description: 'ID del profesional (admin)'})
  @ApiResponse({ status: HttpStatus.OK, type: AgendaConfigResponseDto }) // Asegúrate que este DTO exista y sea correcto
  async getConfig(
      @Request() req,
      @Query('professionalId') professionalIdQuery?: number,
    ): Promise<AgendaConfigResponseDto | null> {
    const targetProfessionalId = professionalIdQuery || req.user.id;
    const config = await this.agendaService.getConfig(targetProfessionalId);
    // Aquí necesitarías mapear la entidad AgendaConfig a AgendaConfigResponseDto si son diferentes
    // Por ahora, asumo que son compatibles o el servicio ya devuelve algo adecuado.
    // Ejemplo de mapeo si fuera necesario:
    // if (!config) return null;
    // return {
    //   id: config.id,
    //   userId: config.user.id, // o professionalId
    //   slotDurationMinutes: config.slotDuration,
    //   workStart: config.startTime,
    //   workEnd: config.endTime,
    //   workingDays: config.workingDays.map(d => /* convertir a número si es necesario */),
    //   allowOverbooking: config.overbookingAllowed,
    //   allowBookingOnBlockedDays: config.allowBookingOnBlockedDays,
    // };
    return config as any; // Ajustar mapeo si es necesario
  }

  @Patch('config')
  @Permissions('canManageAgenda')
  @ApiOperation({ summary: 'Actualizar configuración de agenda del profesional actual (o especificado)' })
  @ApiQuery({ name: 'professionalId', required: false, type: Number, description: 'ID del profesional a configurar (admin)'})
  @ApiResponse({ status: HttpStatus.OK, type: AgendaConfigResponseDto })
  async updateConfig(
    @Body() dto: UpdateAgendaConfigDto, 
    @Request() req,
    @Query('professionalId') professionalIdQuery?: number,
    ): Promise<AgendaConfigResponseDto> {
    const targetProfessionalId = professionalIdQuery || req.user.id;
    const updatedConfig = await this.agendaService.updateConfig(targetProfessionalId, dto);
    // Similar a getConfig, mapear a DTO si es necesario
    return updatedConfig as any; // Ajustar mapeo si es necesario
  }

  @Post('holiday')
  @Permissions('canManageAgenda')
  @ApiOperation({ summary: 'Agregar feriado para un profesional' })
  @ApiQuery({ name: 'professionalId', required: false, type: Number, description: 'ID del profesional (admin)'})
  @ApiResponse({ status: HttpStatus.CREATED, type: HolidayResponseDto }) // Asegúrate que HolidayResponseDto exista
  async addHoliday(
    @Body() dto: CreateHolidayDto, 
    @Request() req,
    @Query('professionalId') professionalIdQuery?: number,
    ): Promise<HolidayResponseDto> {
    const targetProfessionalId = professionalIdQuery || req.user.id;
    const holiday = await this.agendaService.addHoliday(dto, targetProfessionalId);
    // Mapear Holiday a HolidayResponseDto
    return {
        id: holiday.id,
        userId: holiday.user.id, // o professionalId
        date: holiday.date,
        description: holiday.reason, // 'reason' en la entidad
    };
  }

  @Get('holidays')
  @ApiOperation({ summary: 'Listar feriados de un profesional' })
  @ApiQuery({ name: 'professionalId', required: false, type: Number, description: 'ID del profesional (admin)'})
  @ApiResponse({ status: HttpStatus.OK, type: [HolidayResponseDto] })
  async getHolidays(
    @Request() req,
    @Query('professionalId') professionalIdQuery?: number,
  ): Promise<HolidayResponseDto[]> {
    const targetProfessionalId = professionalIdQuery || req.user.id;
    const holidays = await this.agendaService.getHolidays(targetProfessionalId);
    return holidays.map(h => ({
        id: h.id,
        userId: h.user.id,
        date: h.date,
        description: h.reason,
    }));
  }



  

@Get('summary')
  @ApiOperation({ summary: 'Resumen de citas por estado y día para un profesional' })
  @ApiQuery({ name: 'from', required: true, type: String, description: 'Fecha de inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'to', required: true, type: String, description: 'Fecha de fin (YYYY-MM-DD)' })
  @ApiQuery({ name: 'professionalId', required: false, type: Number, description: 'ID del profesional (admin)'})
  @ApiResponse({ status: HttpStatus.OK, type: AppointmentSummaryResponseDto })
  async getSummary(
    @Request() req,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('professionalId') professionalIdQuery?: number,
  ): Promise<AppointmentSummaryResponseDto> {
    const targetProfessionalId = professionalIdQuery || req.user.id;
    const summaryData = await this.agendaService.getSummary(targetProfessionalId, from, to);

    // Mapeo del resultado del servicio al DTO
    const responseDto: AppointmentSummaryResponseDto = {
      total: summaryData.total,
      pending: summaryData.byStatus[AppointmentStatus.PENDING] || 0,
      confirmed: summaryData.byStatus[AppointmentStatus.CONFIRMED] || 0,
      checkedIn: summaryData.byStatus[AppointmentStatus.CHECKED_IN] || 0,
      inProgress: summaryData.byStatus[AppointmentStatus.IN_PROGRESS] || 0,
      completed: summaryData.byStatus[AppointmentStatus.COMPLETED] || 0,
      cancelled: summaryData.byStatus[AppointmentStatus.CANCELLED] || 0,
      noShow: summaryData.byStatus[AppointmentStatus.NO_SHOW] || 0,
      // Si tienes más estados en AppointmentStatus, añádelos aquí
      // byDate: summaryData.byDate, // Si quieres incluir byDate en el DTO, añádelo a AppointmentSummaryResponseDto
    };
    return responseDto;
  }

  @Get('today')
  @ApiOperation({ summary: 'Turnos del día actual del profesional logueado (o especificado)' })
  @ApiQuery({ name: 'professionalId', required: false, type: Number, description: 'ID del profesional (admin)'})
  @ApiResponse({ status: HttpStatus.OK, type: [AppointmentResponseDto] })
  async getToday(
    @Request() req,
    @Query('professionalId') professionalIdQuery?: number,
    ): Promise<AppointmentResponseDto[]> {
    const targetProfessionalId = professionalIdQuery || req.user.id;
    const from = startOfToday().toISOString();
    const to = endOfToday().toISOString();
    const appointments = await this.agendaService.getAppointments({ from, to, professionalId: targetProfessionalId }, req.user.id);
    return appointments.map(mapAppointmentToResponseDto);
  }

  @Get('week')
  @ApiOperation({ summary: 'Turnos de la semana actual del profesional logueado (o especificado)' })
  @ApiQuery({ name: 'professionalId', required: false, type: Number, description: 'ID del profesional (admin)'})
  @ApiResponse({ status: HttpStatus.OK, type: [AppointmentResponseDto] })
  async getWeek(
    @Request() req,
    @Query('professionalId') professionalIdQuery?: number,
  ): Promise<AppointmentResponseDto[]> {
    const targetProfessionalId = professionalIdQuery || req.user.id;
    const from = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString(); // Lunes como inicio de semana
    const to = endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();
    const appointments = await this.agendaService.getAppointments({ from, to, professionalId: targetProfessionalId }, req.user.id);
    return appointments.map(mapAppointmentToResponseDto);
  }

  // Endpoint para registrar productos usados en una cita
  @Patch(':id/products-used')
  @Permissions('canManageAgenda')
  @ApiOperation({ summary: 'Registrar productos utilizados en la cita' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Productos registrados correctamente.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Cita no encontrada.'})
  async registerProductsUsed(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RegisterProductsUsedDto,
    @Request() req,
  ): Promise<{ message: string }> { // El servicio devuelve un objeto con mensaje
    return this.agendaService.registerProductsUsed(id, dto, req.user);
  }

  // Endpoint para obtener productos usados en una cita
  @Get(':id/products')
  @ApiOperation({ summary: 'Obtener productos utilizados en una cita' })
  @ApiResponse({ status: HttpStatus.OK, type: [AppointmentProductLogResponseDto] })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Cita no encontrada.'})
  async getProductsUsed(
    @Param('id', ParseIntPipe) id: number, 
    @Request() req
  ): Promise<AppointmentProductLogResponseDto[]> {
    const logs = await this.agendaService.getProductsUsedByAppointment(id, req.user.id);
    // Mapear AppointmentProductLog a AppointmentProductLogResponseDto si son diferentes
    return logs.map(log => ({
        productId: log.product.id,
        name: log.product.name, // Asumiendo que quieres el nombre actual del producto
        quantity: log.quantity,
        priceAtTime: log.priceAtTime,
        usedAt: log.usedAt.toISOString(),
    }));
  }

  // Podrías añadir un endpoint DELETE para cancelar/eliminar turnos si es necesario
  @Delete(':id')
  @Permissions('canManageAgenda')
  @ApiOperation({ summary: 'Eliminar un turno (o marcarlo como cancelado)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Turno eliminado o cancelado.', type: AppointmentResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Turno no encontrado.' })
  async deleteAppointment(
      @Param('id', ParseIntPipe) id: number,
      @Request() req
  ): Promise<AppointmentResponseDto> {
      const updatedAppointment = await this.agendaService.update(id, { status: AppointmentStatus.CANCELLED }, req.user); 
      return mapAppointmentToResponseDto(updatedAppointment);
  }
}