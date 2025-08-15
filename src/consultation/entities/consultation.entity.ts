import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Client } from '../../client/entities/client.entity';
// import { Agenda } from '../../agenda/entities/agenda.entity'; // TODO: Uncomment when agenda entity exists
import { FileUpload } from '../../upload/entities/file-upload.entity';
import { Invoice } from '../../invoice/entities/invoice.entity';

export type ConsultationStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

@Entity('consultations')
export class Consultation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'appointment_id', nullable: true })
  appointmentId: number;

  @Column({ name: 'client_id' })
  clientId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({
    type: 'enum',
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
  })
  status: ConsultationStatus;

  @Column({ name: 'consultation_number', unique: true })
  consultationNumber: string;

  @Column({ name: 'start_time', type: 'datetime', nullable: true })
  startTime: Date;

  @Column({ name: 'end_time', type: 'datetime', nullable: true })
  endTime: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  symptoms: string;

  @Column({ type: 'text', nullable: true })
  diagnosis: string;

  @Column({ type: 'text', nullable: true })
  treatment: string;

  @Column({ type: 'text', nullable: true })
  recommendations: string;

  @Column({ name: 'next_appointment', type: 'datetime', nullable: true })
  nextAppointment: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  weight: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  height: number;

  @Column({ name: 'blood_pressure', nullable: true })
  bloodPressure: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  temperature: number;

  @Column({ name: 'heart_rate', type: 'int', nullable: true })
  heartRate: number;

  @Column({ type: 'json', nullable: true })
  vitals: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  allergies: string[];

  @Column({ type: 'json', nullable: true })
  medications: string[];

  @Column({ name: 'follow_up_required', type: 'boolean', default: false })
  followUpRequired: boolean;

  @Column({ name: 'follow_up_date', type: 'datetime', nullable: true })
  followUpDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Client, { eager: true })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  // @ManyToOne(() => Agenda, { nullable: true })
  // @JoinColumn({ name: 'appointment_id' })
  // appointment: Agenda; // TODO: Uncomment when agenda entity exists

  @OneToMany(() => FileUpload, (file) => file.entityId, {
    cascade: true,
  })
  files: FileUpload[];

  @OneToMany(() => Invoice, (invoice) => invoice.consultation)
  invoices: Invoice[];
}