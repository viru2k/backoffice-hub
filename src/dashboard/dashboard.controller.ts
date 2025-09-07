import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardMetricsDto } from './dto/dashboard-metrics.dto';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  @ApiOperation({ 
    summary: 'Obtener métricas completas del dashboard',
    description: 'Retorna todas las métricas necesarias para el dashboard: citas, consultas, clientes, ingresos y métricas por tipo de negocio'
  })
  @ApiResponse({ status: 200, type: DashboardMetricsDto })
  async getMetrics(@Request() req): Promise<DashboardMetricsDto> {
    return this.dashboardService.getMetrics(req.user.id);
  }

  @Get('quick-stats')
  @ApiOperation({ 
    summary: 'Obtener estadísticas rápidas para widgets',
    description: 'Retorna estadísticas básicas para mostrar en widgets del dashboard'
  })
  @ApiResponse({ 
    status: 200,
    schema: {
      example: {
        todayAppointments: 5,
        todayConsultations: 3,
        pendingAppointments: 8,
        activeClients: 120,
        generatedAt: '2024-01-15T10:30:00.000Z'
      }
    }
  })
  async getQuickStats(@Request() req) {
    return this.dashboardService.getQuickStats(req.user.id);
  }

  @Get('recent-activity')
  @ApiOperation({ 
    summary: 'Obtener actividad reciente',
    description: 'Retorna las consultas y citas más recientes del usuario'
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Número de elementos a retornar', example: 10 })
  @ApiResponse({ 
    status: 200,
    schema: {
      example: [
        {
          type: 'consultation',
          id: 123,
          title: 'Consulta #CONS-1642234567890-001',
          client: 'Juan Pérez',
          status: 'completed',
          date: '2024-01-15T14:30:00.000Z',
          consultationType: 'Consulta General'
        },
        {
          type: 'appointment',
          id: 456,
          title: 'Cita de seguimiento',
          client: 'María García',
          status: 'confirmed',
          date: '2024-01-15T10:00:00.000Z',
          startTime: '2024-01-16T09:00:00.000Z'
        }
      ]
    }
  })
  async getRecentActivity(
    @Request() req,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    return this.dashboardService.getRecentActivity(req.user.id, limit);
  }

  @Get('appointments/summary')
  @ApiOperation({ 
    summary: 'Resumen de citas para dashboard',
    description: 'Retorna métricas específicas de citas organizadas para el dashboard'
  })
  @ApiResponse({ 
    status: 200,
    schema: {
      example: {
        total: 150,
        pending: 10,
        confirmed: 20,
        completed: 100,
        cancelled: 20,
        today: 5,
        thisWeek: 25,
        thisMonth: 80
      }
    }
  })
  async getAppointmentsSummary(@Request() req) {
    const metrics = await this.dashboardService.getMetrics(req.user.id);
    return metrics.appointments;
  }

  @Get('consultations/summary')
  @ApiOperation({ 
    summary: 'Resumen de consultas para dashboard',
    description: 'Retorna métricas específicas de consultas organizadas para el dashboard'
  })
  @ApiResponse({ 
    status: 200,
    schema: {
      example: {
        total: 200,
        pending: 15,
        inProgress: 5,
        completed: 170,
        cancelled: 10,
        today: 3,
        thisWeek: 20,
        thisMonth: 60
      }
    }
  })
  async getConsultationsSummary(@Request() req) {
    const metrics = await this.dashboardService.getMetrics(req.user.id);
    return metrics.consultations;
  }

  @Get('clients/summary')
  @ApiOperation({ 
    summary: 'Resumen de clientes para dashboard',
    description: 'Retorna métricas específicas de clientes organizadas para el dashboard'
  })
  @ApiResponse({ 
    status: 200,
    schema: {
      example: {
        total: 500,
        active: 450,
        inactive: 50,
        newThisMonth: 25,
        newThisWeek: 8
      }
    }
  })
  async getClientsSummary(@Request() req) {
    const metrics = await this.dashboardService.getMetrics(req.user.id);
    return metrics.clients;
  }

  @Get('revenue/summary')
  @ApiOperation({ 
    summary: 'Resumen de ingresos para dashboard',
    description: 'Retorna métricas específicas de ingresos organizadas para el dashboard'
  })
  @ApiResponse({ 
    status: 200,
    schema: {
      example: {
        totalRevenue: 50000.00,
        todayRevenue: 1200.00,
        thisWeekRevenue: 8500.00,
        thisMonthRevenue: 25000.00,
        pendingPayments: 5000.00,
        overdue: 1500.00
      }
    }
  })
  async getRevenueSummary(@Request() req) {
    const metrics = await this.dashboardService.getMetrics(req.user.id);
    return metrics.revenue;
  }

  @Get('business-types/performance')
  @ApiOperation({ 
    summary: 'Rendimiento por tipo de negocio',
    description: 'Retorna métricas de rendimiento organizadas por tipo de negocio'
  })
  @ApiResponse({ 
    status: 200,
    schema: {
      example: [
        {
          businessTypeId: 1,
          businessTypeName: 'Psicología',
          consultationsCount: 80,
          appointmentsCount: 50,
          revenue: 12000.00
        },
        {
          businessTypeId: 2,
          businessTypeName: 'Veterinaria',
          consultationsCount: 120,
          appointmentsCount: 75,
          revenue: 18000.00
        }
      ]
    }
  })
  async getBusinessTypePerformance(@Request() req) {
    const metrics = await this.dashboardService.getMetrics(req.user.id);
    return metrics.businessTypes;
  }
}