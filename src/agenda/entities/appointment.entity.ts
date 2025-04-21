import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from 'src/user/entities/user.entity';

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'cancelled'
  | 'completed'
  | 'no_show';

@Entity()
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  date: Date;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @Column({
    type: 'enum',
    enum: [
      'pending',
      'confirmed',
      'checked_in',
      'in_progress',
      'cancelled',
      'completed',
      'no_show',
    ],
    default: 'pending',
  })
  status: AppointmentStatus;

  @CreateDateColumn()
  createdAt: Date;
}
