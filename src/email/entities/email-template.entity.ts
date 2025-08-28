import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum EmailTemplateType {
  WELCOME = 'welcome',
  PASSWORD_RESET = 'password_reset',
  APPOINTMENT_REMINDER = 'appointment_reminder',
  APPOINTMENT_CONFIRMATION = 'appointment_confirmation',
  REWARD_NOTIFICATION = 'reward_notification',
  CUSTOM = 'custom',
}

@Entity('email_templates')
export class EmailTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  subject: string;

  @Column('text')
  htmlContent: string;

  @Column({ type: 'text', nullable: true })
  textContent: string;

  @Column({
    type: 'enum',
    enum: EmailTemplateType,
  })
  type: EmailTemplateType;

  @Column('json')
  variables: string[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'int', default: 0 })
  usageCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastUsed: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  createdBy: string;
}