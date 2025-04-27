import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from  './../../user/entities/user.entity'//'src/user/entities/user.entity';
import { Client } from './../..//client/entities/client.entity';

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
name: string;


  @Column()
  date: Date;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'datetime', nullable: true })
  reminderSentAt: Date;
  
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

  @ManyToOne(() => Client, (client) => client.appointments, { nullable: false, onDelete: 'CASCADE' })
client: Client;


  @CreateDateColumn()
  createdAt: Date;
}
