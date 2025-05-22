import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './../../user/entities/user.entity'; // Asegúrate que la ruta sea correcta
import { Client } from './../../client/entities/client.entity'; // Asegúrate que la ruta sea correcta


export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked_in',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
  RESCHEDULED = 'rescheduled', 
}


@Entity('appointment')
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true, comment: 'Descripción detallada del turno' }) 
  description?: string;

  @Column({ type: 'datetime', comment: 'Fecha y hora de inicio del turno' })
  startDateTime: Date;

  @Column({ type: 'datetime', comment: 'Fecha y hora de fin del turno', nullable: true })
  endDateTime?: Date;

  @Column({ type: 'text', nullable: true, comment: 'Notas adicionales sobre el turno' })
  notes?: string;

  @Column({ default: false, comment: 'Indica si el evento dura todo el día' })
  allDay: boolean;

  @Column({ nullable: true, comment: 'Color del evento en el calendario' })
  color?: string;

  @ManyToOne(() => User, { 
    eager: true, 
    nullable: true 
    // El comentario fue eliminado de aquí
  })
  professional?: User;

  @ManyToOne(() => Client, (client) => client.appointments, { 
    nullable: true, 
    onDelete: 'SET NULL' 
    // El comentario fue eliminado de aquí
  })
  client?: Client;

@Column({
    type: 'enum',
    enum: AppointmentStatus, 
    default: AppointmentStatus.PENDING,
  })
  status: AppointmentStatus;
  
  @Column({ nullable: true, comment: 'ID del servicio asociado (si aplica)' })
  serviceId?: number; 

  @Column({ nullable: true, comment: 'ID de la sala o recurso físico (si aplica)' })
  roomId?: number;

  @Column({ type: 'datetime', nullable: true, comment: 'Momento en que se envió el recordatorio' })
  reminderSentAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}