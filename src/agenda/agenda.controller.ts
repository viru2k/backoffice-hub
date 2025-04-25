import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AgendaService } from './agenda.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { BookAppointmentDto } from './dto/book-appointment.dto';

import { UpdateAgendaConfigDto } from './dto/update-agenda-config.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import {
  endOfToday,
  endOfWeek,
  startOfToday,
  startOfWeek,
} from 'date-fns';
import { CreateHolidayDto } from './entities/create-holiday.dto';
import { RegisterProductsUsedDto } from './dto/register-products-used.dto';

@ApiTags('agenda')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('agenda')
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un turno manual' })
  create(@Body() dto: CreateAppointmentDto, @Request() req) {
    return this.agendaService.create(dto, req.user);
  }

  @Post('book')
  @ApiOperation({ summary: 'Reservar un turno en un slot disponible' })
  book(@Body() dto: BookAppointmentDto, @Request() req) {
    return this.agendaService.book(dto, req.user);
  }

  @ApiQuery({ name: 'date', required: false, type: String })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: [
      'pending',
      'confirmed',
      'checked_in',
      'in_progress',
      'cancelled',
      'completed',
      'no_show',
    ],
  })
  @Get()
  @ApiOperation({ summary: 'Obtener turnos por fecha, rango o estado' })
  getAppointments(
    @Request() req,
    @Query('date') date?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: string,
  ) {
    return this.agendaService.getAppointments({ date, from, to, status }, req.user.id);
  }

  @Get('available')
  @ApiOperation({ summary: 'Ver slots disponibles para un día' })
  getAvailable(@Query('date') date: string, @Request() req) {
    return this.agendaService.getAvailableSlots(date, req.user.id);
  }

  @Get('config')
  @ApiOperation({ summary: 'Obtener configuración personalizada de agenda' })
  getConfig(@Request() req) {
    return this.agendaService.getConfig(req.user.id);
  }

  @Patch('config')
  @ApiOperation({ summary: 'Actualizar configuración de agenda' })
  updateConfig(@Body() dto: UpdateAgendaConfigDto, @Request() req) {
    return this.agendaService.updateConfig(req.user.id, dto);
  }

  @Post('holiday')
  @ApiOperation({ summary: 'Agregar feriado para bloquear ese día' })
  addHoliday(@Body() dto: CreateHolidayDto, @Request() req) {
    return this.agendaService.addHoliday(dto, req.user.id);
  }

  @Get('holidays')
  @ApiOperation({ summary: 'Listar feriados configurados por el usuario' })
  getHolidays(@Request() req) {
    return this.agendaService.getHolidays(req.user.id);
  }

  @ApiQuery({ name: 'from', required: true, type: String })
  @ApiQuery({ name: 'to', required: true, type: String })
  @Get('summary')
  @ApiOperation({ summary: 'Resumen de citas por estado y por día' })
  getSummary(
    @Request() req,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.agendaService.getSummary(req.user.id, from, to);
  }

  @Get('today')
  @ApiOperation({ summary: 'Turnos del día actual' })
  getToday(@Request() req) {
    const from = startOfToday().toISOString();
    const to = endOfToday().toISOString();
    return this.agendaService.getAppointments({ from, to }, req.user.id);
  }

  @Get('week')
  @ApiOperation({ summary: 'Turnos de la semana actual' })
  getWeek(@Request() req) {
    const from = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();
    const to = endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();
    return this.agendaService.getAppointments({ from, to }, req.user.id);
  }

  @Patch(':id/products-used')
@ApiOperation({ summary: 'Registrar productos utilizados en la cita' })
registerProductsUsed(
  @Param('id') id: number,
  @Body() dto: RegisterProductsUsedDto,
  @Request() req,
) {
  return this.agendaService.registerProductsUsed(id, dto, req.user);
}

@Get(':id/products')
@ApiOperation({ summary: 'Obtener productos utilizados en una cita' })
getProductsUsed(@Param('id') id: number, @Request() req) {
  return this.agendaService.getProductsUsedByAppointment(id, req.user.id);
}


}
