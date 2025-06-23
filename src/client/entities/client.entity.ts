import { Appointment } from "./../../agenda/entities/appointment.entity";
import { User } from "./../../user/entities/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn,  } from "typeorm";


export enum ClientStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  CREATED = 'CREATED',
  UNUSED = 'UNUSED',
}


@Entity()
export class Client {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fullname: string; // nombre completo para búsqueda rápida

  @Column()
  name: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  gender?: 'male' | 'female' | 'other';

  @Column({ type: 'date', nullable: true })
  birthDate?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;
  


 @Column({
    type: 'enum',
    enum: ClientStatus, 
    default: ClientStatus.CREATED, 
  })
  status: ClientStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  
  @ManyToOne(() => User, { eager: true })
  owner: User;

  @ManyToOne(() => User, (user) => user.clients, { onDelete: 'CASCADE' })
  user: User;

  @OneToMany(() => Appointment, (appointment) => appointment.client)
  appointments: Appointment[];
}
