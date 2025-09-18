import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

export enum ServiceStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Entity('business_services')
export class Service {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 100, nullable: true })
  category: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basePrice: number;

  @Column({ type: 'int', nullable: true })
  duration: number; // Duration in minutes

  @Column({
    type: 'enum',
    enum: ServiceStatus,
    default: ServiceStatus.ACTIVE,
  })
  status: ServiceStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ length: 500, nullable: true })
  thumbnailUrl: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column({ name: 'ownerId' })
  ownerId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}