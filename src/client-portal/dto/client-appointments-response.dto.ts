import { ApiProperty } from '@nestjs/swagger';

export class ClientAppointmentResponseDto {
  @ApiProperty({ description: 'ID de la cita' })
  id: number;

  @ApiProperty({ description: 'Fecha y hora de la cita' })
  appointmentDate: Date;

  @ApiProperty({ description: 'Tipo de servicio' })
  serviceType?: string;

  @ApiProperty({ description: 'Estado de la cita' })
  status: string;

  @ApiProperty({ description: 'Notas de la cita', required: false })
  notes?: string;

  @ApiProperty({ description: 'Duración en minutos', required: false })
  durationMinutes?: number;

  @ApiProperty({ description: 'Profesional asignado', required: false })
  professional?: {
    id: number;
    name: string;
    email?: string;
  };

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Última actualización' })
  updatedAt: Date;
}

export class ClientAppointmentsListDto {
  @ApiProperty({ type: [ClientAppointmentResponseDto] })
  appointments: ClientAppointmentResponseDto[];

  @ApiProperty({ description: 'Total de citas' })
  total: number;

  @ApiProperty({ description: 'Página actual' })
  page: number;

  @ApiProperty({ description: 'Elementos por página' })
  limit: number;
}