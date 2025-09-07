import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum EmailStatus {
  SENT = 'sent',
  FAILED = 'failed',
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
}

@Entity('email_logs')
export class EmailLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('json')
  to: string[];

  @Column({ type: 'json', nullable: true })
  cc: string[];

  @Column({ type: 'json', nullable: true })
  bcc: string[];

  @Column()
  subject: string;

  @Column({
    type: 'enum',
    enum: EmailStatus,
  })
  status: EmailStatus;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  failedAt: Date;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ nullable: true })
  templateUsed: string;

  @Column({ nullable: true })
  userId: string;

  @Column({ type: 'json', nullable: true })
  relatedEntity: {
    type: string;
    id: string;
  };

  @Column({ type: 'json', nullable: true })
  deliveryStats: {
    opens: number;
    clicks: number;
    bounces: number;
  };

  @Column({ type: 'text', nullable: true })
  htmlContent: string;

  @Column({ type: 'text', nullable: true })
  textContent: string;

  @Column({ default: 'normal' })
  priority: string;
}