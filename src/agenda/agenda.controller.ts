import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ServiceGuard } from 'src/common/guards/service.guard';
import { RequiresService } from 'src/common/decorators/requires-service.decorator';
import { AgendaService } from './agenda.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('agenda')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), ServiceGuard)
@RequiresService('agenda')
@Controller('agenda')
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva cita' })
  create(@Body() dto: CreateAppointmentDto, @Request() req) {
    return this.agendaService.create(dto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las citas del usuario autenticado' })
  findAll(@Request() req) {
    return this.agendaService.findAll(req.user);
  }
}
