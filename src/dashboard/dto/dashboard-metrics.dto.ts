import { ApiProperty } from '@nestjs/swagger';

export class AppointmentMetricsDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  pending: number;

  @ApiProperty()
  confirmed: number;

  @ApiProperty()
  completed: number;

  @ApiProperty()
  cancelled: number;

  @ApiProperty()
  today: number;

  @ApiProperty()
  thisWeek: number;

  @ApiProperty()
  thisMonth: number;
}

export class ConsultationMetricsDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  pending: number;

  @ApiProperty()
  inProgress: number;

  @ApiProperty()
  completed: number;

  @ApiProperty()
  cancelled: number;

  @ApiProperty()
  today: number;

  @ApiProperty()
  thisWeek: number;

  @ApiProperty()
  thisMonth: number;
}

export class ClientMetricsDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  active: number;

  @ApiProperty()
  inactive: number;

  @ApiProperty()
  newThisMonth: number;

  @ApiProperty()
  newThisWeek: number;
}

export class RevenueMetricsDto {
  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  todayRevenue: number;

  @ApiProperty()
  thisWeekRevenue: number;

  @ApiProperty()
  thisMonthRevenue: number;

  @ApiProperty()
  pendingPayments: number;

  @ApiProperty()
  overdue: number;
}

export class BusinessTypeMetricsDto {
  @ApiProperty()
  businessTypeId: number;

  @ApiProperty()
  businessTypeName: string;

  @ApiProperty()
  consultationsCount: number;

  @ApiProperty()
  appointmentsCount: number;

  @ApiProperty()
  revenue: number;
}

export class DashboardMetricsDto {
  @ApiProperty({ type: AppointmentMetricsDto })
  appointments: AppointmentMetricsDto;

  @ApiProperty({ type: ConsultationMetricsDto })
  consultations: ConsultationMetricsDto;

  @ApiProperty({ type: ClientMetricsDto })
  clients: ClientMetricsDto;

  @ApiProperty({ type: RevenueMetricsDto })
  revenue: RevenueMetricsDto;

  @ApiProperty({ type: [BusinessTypeMetricsDto] })
  businessTypes: BusinessTypeMetricsDto[];

  @ApiProperty()
  generatedAt: Date;
}