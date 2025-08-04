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
  

  @Column({ default: false })
  overbookingAllowed: boolean;

  @Column({ default: false })
  allowBookingOnBlockedDays: boolean;

  @Column({ type: 'int', default: 60 }) // minutos antes del turno
  reminderOffsetMinutes: number;
}
