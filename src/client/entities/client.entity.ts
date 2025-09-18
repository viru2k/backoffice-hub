import { Appointment } from "./../../agenda/entities/appointment.entity";
import { User } from "./../../user/entities/user.entity";
import { CustomerReward } from "./../../rewards/entities/customer-reward.entity";
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

  @Column({ nullable: true, unique: true })
  membershipNumber?: string;

  @Column({ nullable: true })
  gender?: 'male' | 'female' | 'other';

  @Column({ type: 'date', nullable: true })
  birthDate?: Date;

  @Column({ nullable: true })
  dniType?: 'DNI' | 'NIE' | 'PASAPORTE';

  @Column({ nullable: true })
  dniNumber?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;
  
  // Portal de clientes - campos agregados
  @Column({ default: false })
  hasPortalAccess: boolean;

  @Column({ nullable: true })
  password?: string;

  @Column({ type: 'datetime', nullable: true })
  lastLogin?: Date;

  @Column({ nullable: true })
  passwordResetToken?: string;

  @Column({ type: 'datetime', nullable: true })
  passwordResetExpires?: Date;

  @Column({ nullable: true })
  preferredName?: string;

  @Column({ type: 'text', nullable: true })
  personalNotes?: string;

  @Column({ nullable: true })
  emailVerificationToken?: string;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({ type: 'text', nullable: true })
  adminNotes?: string;

  @Column({
    type: 'enum',
    enum: ClientStatus,
    default: ClientStatus.CREATED,
  })
  status: ClientStatus;

  // Soft delete fields
  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'datetime', nullable: true })
  deactivatedAt?: Date;

  @Column({ nullable: true })
  deactivatedBy?: number;

  @Column({ type: 'text', nullable: true })
  deactivationReason?: string;

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

  @OneToMany(() => CustomerReward, (customerReward) => customerReward.client)
  rewards: CustomerReward[];
}
