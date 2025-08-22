import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Consultation } from './consultation.entity';

export enum ConsultationTokenStatus {
  ACTIVE = 'ACTIVE',
  USED = 'USED',
  EXPIRED = 'EXPIRED',
}

@Entity('consultation_tokens')
export class ConsultationToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  token: string;

  @Column({
    type: 'enum',
    enum: ConsultationTokenStatus,
    default: ConsultationTokenStatus.ACTIVE,
  })
  status: ConsultationTokenStatus;

  @Column({ type: 'datetime' })
  expiresAt: Date;

  @Column({ type: 'datetime', nullable: true })
  usedAt: Date;

  @Column({ type: 'json', nullable: true })
  allowedActions: string[];

  @Column({ type: 'text', nullable: true })
  customMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Consultation, (consultation) => consultation.tokens, {
    onDelete: 'CASCADE',
  })
  consultation: Consultation;

  get isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  get isValid(): boolean {
    return this.status === ConsultationTokenStatus.ACTIVE && !this.isExpired;
  }
}