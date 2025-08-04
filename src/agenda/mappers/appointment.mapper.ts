import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import { AppointmentResponseDto, AppointmentProfessionalResponseDto, AppointmentClientResponseDto } from '../dto/appointment-response.dto';
import { STATUS_COLORS } from '../constants/colors';

export function mapAppointmentToResponseDto(appointment: Appointment): AppointmentResponseDto {
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
      clientId: appointment.client?.id,
      notes: appointment.notes,
      // Add other relevant fields for frontend calendar here
      professionalId: appointment.professional?.id,
      serviceId: appointment.serviceId,
      roomId: appointment.roomId,
    },
  };
}
