import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity()
export class AgendaConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({ type: 'int', default: 15 }) // duración en minutos
  slotDuration: number;

  @Column({ type: 'simple-array' })
  workingDays: string[];
  
  // Monday schedule
  @Column({ default: false })
  mondayEnabled: boolean;

  @Column({ type: 'time', nullable: true })
  mondayStart?: string;

  @Column({ type: 'time', nullable: true })
  mondayEnd?: string;

  // Tuesday schedule
  @Column({ default: false })
  tuesdayEnabled: boolean;

  @Column({ type: 'time', nullable: true })
  tuesdayStart?: string;

  @Column({ type: 'time', nullable: true })
  tuesdayEnd?: string;

  // Wednesday schedule
  @Column({ default: false })
  wednesdayEnabled: boolean;

  @Column({ type: 'time', nullable: true })
  wednesdayStart?: string;

  @Column({ type: 'time', nullable: true })
  wednesdayEnd?: string;

  // Thursday schedule
  @Column({ default: false })
  thursdayEnabled: boolean;

  @Column({ type: 'time', nullable: true })
  thursdayStart?: string;

  @Column({ type: 'time', nullable: true })
  thursdayEnd?: string;

  // Friday schedule
  @Column({ default: false })
  fridayEnabled: boolean;

  @Column({ type: 'time', nullable: true })
  fridayStart?: string;

  @Column({ type: 'time', nullable: true })
  fridayEnd?: string;

  // Saturday schedule
  @Column({ default: false })
  saturdayEnabled: boolean;

  @Column({ type: 'time', nullable: true })
  saturdayStart?: string;

  @Column({ type: 'time', nullable: true })
  saturdayEnd?: string;

  // Sunday schedule
  @Column({ default: false })
  sundayEnabled: boolean;

  @Column({ type: 'time', nullable: true })
  sundayStart?: string;

  @Column({ type: 'time', nullable: true })
  sundayEnd?: string;

  @Column({ default: false })
  overbookingAllowed: boolean;

  @Column({ default: false })
  allowBookingOnBlockedDays: boolean;

  @Column({ type: 'int', default: 60 }) // minutos antes del turno
  reminderOffsetMinutes: number;
}
