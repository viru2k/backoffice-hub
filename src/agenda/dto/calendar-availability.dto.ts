export enum DayStatus {
  AVAILABLE = 'available',           // Verde - Día con citas disponibles
  LIMITED = 'limited',              // Amarillo - Pocas citas disponibles
  FULL = 'full',                   // Rojo - Agenda llena
  BLOCKED = 'blocked',             // Gris - Día bloqueado/inhabilitado
  HOLIDAY = 'holiday',             // Azul - Feriado
  PAST = 'past',                   // Gris oscuro - Día pasado
  UNAVAILABLE = 'unavailable'      // Gris claro - Día no laborable
}

export class DayAvailabilityDto {
  date: string;               // YYYY-MM-DD
  dayOfWeek: number;         // 0-6 (domingo=0)
  status: DayStatus;
  totalSlots: number;        // Total de slots disponibles en el día
  availableSlots: number;    // Slots libres
  bookedAppointments: number; // Citas reservadas
  isWorkingDay: boolean;     // Si es día laborable
  isHoliday: boolean;        // Si es feriado
  isBlocked: boolean;        // Si está bloqueado manualmente
  workingHours?: {           // Horarios de trabajo del día
    start: string;           // HH:mm
    end: string;             // HH:mm
  };
  notes?: string;            // Notas especiales del día
}

export class CalendarAvailabilityDto {
  year: number;
  month: number;             // 1-12
  days: DayAvailabilityDto[];
  totalWorkingDays: number;
  totalAvailableSlots: number;
  totalBookedAppointments: number;
  generatedAt: Date;
}

export class CalendarAvailabilityQueryDto {
  year: number;
  month: number;
  professionalId?: number;   // Si se quiere filtrar por profesional específico
}