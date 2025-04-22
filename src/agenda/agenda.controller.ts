import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Patch,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ServiceGuard } from 'src/common/guards/service.guard';
import { RequiresService } from 'src/common/decorators/requires-service.decorator';
import { AgendaService } from './agenda.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { UpdateAgendaConfigDto } from './dto/update-agenda-config.dto';
import { CreateHolidayDto } from './entities/create-holiday.dto';

@ApiTags('agenda')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), ServiceGuard)
@RequiresService('agenda')
@Controller('agenda')
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva cita para el usuario autenticado' })
  create(@Body() dto: CreateAppointmentDto, @Request() req) {
    return this.agendaService.create(dto, req.user);
  }

  @Patch(':id/status')
@ApiOperation({ summary: 'Actualizar el estado de una cita (solo si pertenece al usuario)' })
updateStatus(
  @Param('id') id: number,
  @Body() dto: UpdateAppointmentStatusDto,
  @Request() req,
) {
  return this.agendaService.updateStatus(id, req.user.id, dto.status);
}

  @Get()
  @ApiOperation({ summary: 'Obtener citas propias del usuario autenticado' })
  findAll(@Request() req) {
    return this.agendaService.findAll(req.user);
  }

  @Patch('config')
@ApiOperation({ summary: 'Actualizar la configuración de la agenda del usuario actual' })
updateAgendaConfig(@Body() dto: UpdateAgendaConfigDto, @Request() req) {
  return this.agendaService.updateConfig(dto, req.user.id);
}

@Get('config')
@ApiOperation({ summary: 'Obtener configuración de agenda del usuario actual' })
getAgendaConfig(@Request() req) {
  return this.agendaService.getConfig(req.user.id);
}

@Post('holiday')
@ApiOperation({ summary: 'Registrar un feriado para bloquear turnos ese día' })
addHoliday(@Body() dto: CreateHolidayDto, @Request() req) {
  return this.agendaService.addHoliday(dto, req.user.id);
}

@Get('holidays')
@ApiOperation({ summary: 'Obtener todos los feriados del usuario' })
getHolidays(@Request() req) {
  return this.agendaService.getHolidays(req.user.id);
}

}
