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
  BadRequestException,
} from '@nestjs/common';
import { AgendaService } from './agenda.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { BookAppointmentDto } from './dto/book-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto'; 
import { UpdateAgendaConfigDto } from './dto/update-agenda-config.dto';
import { BlockDatesDto } from './dto/block-dates.dto';
import { BulkConfigUpdateDto } from './dto/bulk-config-update.dto';
import { DayOverrideDto } from './dto/day-override.dto';
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
import { UserService } from '../user/user.service';
import { PermissionsGuard } from '../common/guards/permissions.guard'; 
import { Permissions } from '../common/decorators/permissions.decorator';


// Esta función convierte la entidad Appointment a AppointmentResponseDto
import { mapAppointmentToResponseDto } from './mappers/appointment.mapper';


@ApiTags('agenda')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('agenda')
export class AgendaController {
  constructor(private readonly agendaService: AgendaService, private readonly userService: UserService) {}

  @Post()
  @Permissions('agenda:write:own', 'agenda:write:group')
  @ApiOperation({ summary: 'Crear un turno manual' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Turno creado exitosamente.', type: AppointmentResponseDto })
  async create(@Body() dto: CreateAppointmentDto, @Request() req): Promise<AppointmentResponseDto> {
    const appointmentEntity = await this.agendaService.create(dto, req.user);
    return mapAppointmentToResponseDto(appointmentEntity);
  }

  @Patch(':id') // Ruta para actualizar un turno
  @Permissions('agenda:write:own', 'agenda:write:group')
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
  @Permissions('agenda:write:own', 'agenda:write:group')
  @ApiOperation({ summary: 'Reservar un turno en un slot disponible (cliente o profesional)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Turno reservado exitosamente.', type: AppointmentResponseDto })
  async book(@Body() dto: BookAppointmentDto, @Request() req): Promise<AppointmentResponseDto> {
    // Asumimos que req.user es quien está haciendo la reserva.
    // El servicio `book` podría necesitar lógica para determinar el profesional si no es req.user
    const appointmentEntity = await this.agendaService.book(dto, req.user);
    return mapAppointmentToResponseDto(appointmentEntity);
  }

  @Get()
  @Permissions('agenda:read:own', 'agenda:read:group')
  @ApiOperation({ summary: 'Obtener turnos por diversos filtros (fecha, rango, estado, profesional)' })
  @ApiQuery({ name: 'date', required: false, type: String, description: 'Fecha específica (YYYY-MM-DD)' })
  @ApiQuery({ name: 'from', required: false, type: String, description: 'Fecha de inicio del rango ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)' })
  @ApiQuery({ name: 'to', required: false, type: String, description: 'Fecha de fin del rango ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)' })
  @ApiQuery({ name: 'status', required: false, isArray: true, enum: AppointmentStatus, description: 'Estados del turno (array): ?status=pending&status=confirmed o ?status=pending,confirmed' })
  @ApiQuery({ name: 'professionalId', required: false, isArray: true, type: Number, description: 'IDs de profesionales para filtrar (array): ?professionalId=1&professionalId=2 o ?professionalId=1,2' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de turnos.', type: [AppointmentResponseDto] })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Parámetros inválidos.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Sin permisos para acceder a la agenda solicitada.' })
  async getAppointments(
    @Request() req,
    @Query('date') date?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: AppointmentStatus | AppointmentStatus[],
    @Query('professionalId') professionalId?: string | string[], // professionalId como array opcional
  ): Promise<AppointmentResponseDto[]> {
    const requestingUser = req.user;

    // Normalizar professionalId a array
    let professionalIds: string[] = [];
    if (professionalId) {
      if (Array.isArray(professionalId)) {
        professionalIds = professionalId;
      } else if (typeof professionalId === 'string') {
        // Soportar tanto formato ?id=1&id=2 como ?id=1,2
        professionalIds = professionalId.includes(',') 
          ? professionalId.split(',').map(id => id.trim())
          : [professionalId];
      }
    }

    // Validar y convertir professionalIds a números
    let professionalIdsAsNumbers: number[] = [];
    if (professionalIds.length > 0) {
      for (const id of professionalIds) {
        const numId = parseInt(id, 10);
        if (isNaN(numId) || numId <= 0) {
          throw new BadRequestException(`El professionalId "${id}" debe ser un número válido mayor a 0.`);
        }
        professionalIdsAsNumbers.push(numId);
      }
    } else {
      // Si no se especifica ningún ID, usar el del usuario actual
      professionalIdsAsNumbers = [req.user.id];
    }

    // Normalizar status a array
    let statusArray: AppointmentStatus[] = [];
    if (status) {
      if (Array.isArray(status)) {
        statusArray = status;
      } else if (typeof status === 'string') {
        // Soportar tanto formato ?status=pending&status=confirmed como ?status=pending,confirmed
        statusArray = status.includes(',') 
          ? status.split(',').map(s => s.trim() as AppointmentStatus)
          : [status];
      }
    }

    // Validar formato de fechas
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('El formato de fecha debe ser YYYY-MM-DD.');
    }
    if (from && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(from)) {
      throw new BadRequestException('El formato de "from" debe ser ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ).');
    }
    if (to && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(to)) {
      throw new BadRequestException('El formato de "to" debe ser ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ).');
    }

    // Validar que 'from' sea anterior a 'to' si ambos están presentes
    if (from && to && new Date(from) >= new Date(to)) {
      throw new BadRequestException('La fecha "from" debe ser anterior a la fecha "to".');
    }

    // Validar estados si se proporcionan
    if (statusArray.length > 0) {
      for (const st of statusArray) {
        if (!Object.values(AppointmentStatus).includes(st)) {
          throw new BadRequestException(`Estado inválido "${st}". Estados válidos: ${Object.values(AppointmentStatus).join(', ')}.`);
        }
      }
    }

    // Verificar permisos para cada professionalId solicitado
    const requestingOtherUsers = professionalIdsAsNumbers.some(id => id !== req.user.id);
    if (requestingOtherUsers) {
      if (!requestingUser.isAdmin) {
        throw new ForbiddenException('No tienes permisos para ver la agenda de otros usuarios.');
      }
      
      // Verificar que todos los usuarios pertenecen al grupo del admin
      for (const profId of professionalIdsAsNumbers) {
        if (profId !== req.user.id) {
          const isMember = await this.userService.isUserInAdminGroup(profId, requestingUser.id);
          if (!isMember) {
            throw new ForbiddenException(`El usuario con ID ${profId} no pertenece a su grupo.`);
          }
        }
      }
    }
    const appointments = await this.agendaService.getAppointments(
      { 
        date, 
        from, 
        to, 
        status: statusArray.length > 0 ? statusArray : undefined, 
        professionalIds: professionalIdsAsNumbers 
      }, 
      req.user.id, // requestingUserId, para posible lógica de permisos en el servicio
    );
    return appointments.map(mapAppointmentToResponseDto);
  }

@Get('available')
@Permissions('agenda:read:own', 'agenda:read:group')
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
      @Query('professionalId') professionalIdQuery?: string,
    ): Promise<AgendaConfigResponseDto | null> {
    const targetProfessionalId = professionalIdQuery ? parseInt(professionalIdQuery, 10) : req.user.id;
    const config = await this.agendaService.getConfig(targetProfessionalId);     
    return config as any; 
  }

  @Patch('config')
  @Permissions('agenda:write:own', 'agenda:write:group')
  @ApiOperation({ summary: 'Actualizar configuración de agenda del profesional actual (o especificado)' })
  @ApiResponse({ status: HttpStatus.OK, type: AgendaConfigResponseDto })
  async updateConfig(
    @Body() dto: UpdateAgendaConfigDto, 
    @Request() req,
    @Query('professionalId') professionalIdQuery?: string,
    ): Promise<AgendaConfigResponseDto> {
    const targetProfessionalId = professionalIdQuery ? parseInt(professionalIdQuery, 10) : req.user.id;
    const updatedConfig = await this.agendaService.updateConfig(targetProfessionalId, dto);
    return updatedConfig as any;
  }

  @Post('holiday')
  @Permissions('agenda:write:own', 'agenda:write:group')
  @ApiOperation({ summary: 'Agregar feriado para un profesional' })
  @ApiQuery({ name: 'professionalId', required: false, type: Number, description: 'ID del profesional (admin)'})
  @ApiResponse({ status: HttpStatus.CREATED, type: HolidayResponseDto }) // Asegúrate que HolidayResponseDto exista
  async addHoliday(
    @Body() dto: CreateHolidayDto, 
    @Request() req,
    @Query('professionalId') professionalIdQuery?: string,
    ): Promise<HolidayResponseDto> {
    const targetProfessionalId = professionalIdQuery ? parseInt(professionalIdQuery, 10) : req.user.id;
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
    @Query('professionalId') professionalIdQuery?: string,
  ): Promise<HolidayResponseDto[]> {
    const targetProfessionalId = professionalIdQuery ? parseInt(professionalIdQuery, 10) : req.user.id;
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
  @ApiQuery({ name: 'professionalId', required: false, type: [Number], description: 'IDs de los profesionales (admin)'})
  @ApiResponse({ status: HttpStatus.OK, type: AppointmentSummaryResponseDto })
  async getSummary(
    @Request() req,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('professionalId') professionalIdQuery?: number[],
  ): Promise<AppointmentSummaryResponseDto> {
    const targetProfessionalIds = professionalIdQuery ? professionalIdQuery : [req.user.id];
    const summaryData = await this.agendaService.getSummary(targetProfessionalIds, from, to);

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
    @Query('professionalId') professionalIdQuery?: string,
    ): Promise<AppointmentResponseDto[]> {
    const targetProfessionalId = professionalIdQuery ? parseInt(professionalIdQuery, 10) : req.user.id;
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
    @Query('professionalId') professionalIdQuery?: string,
  ): Promise<AppointmentResponseDto[]> {
    const targetProfessionalId = professionalIdQuery ? parseInt(professionalIdQuery, 10) : req.user.id;
    const from = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString(); // Lunes como inicio de semana
    const to = endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();
    const appointments = await this.agendaService.getAppointments({ from, to, professionalId: targetProfessionalId }, req.user.id);
    return appointments.map(mapAppointmentToResponseDto);
  }

  // Endpoint para registrar productos usados en una cita
  @Patch(':id/products-used')
  @Permissions('agenda:write:own', 'agenda:write:group')
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
  @Permissions('agenda:write:own', 'agenda:write:group')
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

  // Endpoints para gestión avanzada de agenda

  @Post('block-dates')
  @Permissions('agenda:write:own', 'agenda:write:group')
  @ApiOperation({ summary: 'Bloquear múltiples fechas (vacaciones, días libres)' })
  @ApiQuery({ name: 'professionalId', required: false, type: Number, description: 'ID del profesional (admin)'})
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Fechas bloqueadas exitosamente.' })
  async blockMultipleDates(
    @Body() dto: BlockDatesDto,
    @Request() req,
    @Query('professionalId') professionalIdQuery?: string,
  ): Promise<{ message: string; blockedDates: number }> {
    const targetProfessionalId = professionalIdQuery ? parseInt(professionalIdQuery, 10) : req.user.id;
    const blockedCount = await this.agendaService.blockMultipleDates(dto, targetProfessionalId);
    return {
      message: `${blockedCount} fechas bloqueadas exitosamente`,
      blockedDates: blockedCount
    };
  }

  @Delete('block-dates')
  @Permissions('agenda:write:own', 'agenda:write:group')
  @ApiOperation({ summary: 'Desbloquear fechas específicas' })
  @ApiQuery({ name: 'professionalId', required: false, type: Number, description: 'ID del profesional (admin)'})
  @ApiQuery({ name: 'dates', required: true, type: String, description: 'Fechas separadas por coma (2024-12-25,2024-12-26)'})
  @ApiResponse({ status: HttpStatus.OK, description: 'Fechas desbloqueadas exitosamente.' })
  async unblockDates(
    @Request() req,
    @Query('professionalId') professionalIdQuery?: string,
    @Query('dates') dates?: string,
  ): Promise<{ message: string; unblockedDates: number }> {
    const targetProfessionalId = professionalIdQuery ? parseInt(professionalIdQuery, 10) : req.user.id;
    const dateArray = dates ? dates.split(',').map(d => d.trim()) : [];
    const unblockedCount = await this.agendaService.unblockDates(dateArray, targetProfessionalId);
    return {
      message: `${unblockedCount} fechas desbloqueadas exitosamente`,
      unblockedDates: unblockedCount
    };
  }

  @Post('day-override')
  @Permissions('agenda:write:own', 'agenda:write:group')
  @ApiOperation({ summary: 'Configurar horario especial para un día específico' })
  @ApiQuery({ name: 'professionalId', required: false, type: Number, description: 'ID del profesional (admin)'})
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Override de día configurado exitosamente.' })
  async createDayOverride(
    @Body() dto: DayOverrideDto,
    @Request() req,
    @Query('professionalId') professionalIdQuery?: string,
  ): Promise<{ message: string; override: any }> {
    const targetProfessionalId = professionalIdQuery ? parseInt(professionalIdQuery, 10) : req.user.id;
    const override = await this.agendaService.createDayOverride(dto, targetProfessionalId);
    return {
      message: 'Override de día configurado exitosamente',
      override
    };
  }

  @Get('day-overrides')
  @Permissions('agenda:read:own', 'agenda:read:group')
  @ApiOperation({ summary: 'Listar overrides de días específicos' })
  @ApiQuery({ name: 'professionalId', required: false, type: Number, description: 'ID del profesional (admin)'})
  @ApiQuery({ name: 'from', required: false, type: String, description: 'Fecha de inicio (YYYY-MM-DD)'})
  @ApiQuery({ name: 'to', required: false, type: String, description: 'Fecha de fin (YYYY-MM-DD)'})
  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de overrides de días.' })
  async getDayOverrides(
    @Request() req,
    @Query('professionalId') professionalIdQuery?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<any[]> {
    const targetProfessionalId = professionalIdQuery ? parseInt(professionalIdQuery, 10) : req.user.id;
    return this.agendaService.getDayOverrides(targetProfessionalId, from, to);
  }

  @Patch('bulk-config')
  @Permissions('agenda:write:own', 'agenda:write:group')
  @ApiOperation({ summary: 'Actualización masiva de configuración para rango de fechas' })
  @ApiQuery({ name: 'professionalId', required: false, type: Number, description: 'ID del profesional (admin)'})
  @ApiResponse({ status: HttpStatus.OK, description: 'Configuración masiva aplicada exitosamente.' })
  async bulkConfigUpdate(
    @Body() dto: BulkConfigUpdateDto,
    @Request() req,
    @Query('professionalId') professionalIdQuery?: string,
  ): Promise<{ message: string; affectedDays: number }> {
    const targetProfessionalId = professionalIdQuery ? parseInt(professionalIdQuery, 10) : req.user.id;
    const affectedDays = await this.agendaService.bulkConfigUpdate(dto, targetProfessionalId);
    return {
      message: `Configuración aplicada a ${affectedDays} días`,
      affectedDays
    };
  }

  @Get('availability-range')
  @Permissions('agenda:read:own', 'agenda:read:group')
  @ApiOperation({ summary: 'Obtener disponibilidad para un rango de fechas' })
  @ApiQuery({ name: 'professionalId', required: false, type: Number, description: 'ID del profesional (admin)'})
  @ApiQuery({ name: 'from', required: true, type: String, description: 'Fecha de inicio (YYYY-MM-DD)'})
  @ApiQuery({ name: 'to', required: true, type: String, description: 'Fecha de fin (YYYY-MM-DD)'})
  @ApiResponse({ status: HttpStatus.OK, description: 'Disponibilidad para el rango de fechas.' })
  async getAvailabilityRange(
    @Request() req,
    @Query('professionalId') professionalIdQuery?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<any> {
    const targetProfessionalId = professionalIdQuery ? parseInt(professionalIdQuery, 10) : req.user.id;
    return this.agendaService.getAvailabilityRange(targetProfessionalId, from, to);
  }
}