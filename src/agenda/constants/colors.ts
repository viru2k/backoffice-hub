import { AppointmentStatus } from '../entities/appointment.entity';

export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]: '#f0ad4e',
  [AppointmentStatus.CONFIRMED]: '#3788d8',
  [AppointmentStatus.CHECKED_IN]: '#5cb85c',
  [AppointmentStatus.IN_PROGRESS]: '#28a745',
  [AppointmentStatus.COMPLETED]: '#5bc0de',
  [AppointmentStatus.CANCELLED]: '#777777',
  [AppointmentStatus.NO_SHOW]: '#d9534f',
  [AppointmentStatus.RESCHEDULED]: '#8a2be2', 
};