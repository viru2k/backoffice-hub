import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('email_settings')
export class EmailSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ['gmail', 'outlook', 'yahoo', 'custom'] })
  provider: 'gmail' | 'outlook' | 'yahoo' | 'custom';

  @Column()
  smtpHost: string;

  @Column({ type: 'int' })
  smtpPort: number;

  @Column({ type: 'boolean', default: false })
  smtpSecure: boolean;

  @Column()
  smtpUser: string;

  @Column({ type: 'text' })
  smtpPassword: string; // Encriptado

  @Column()
  fromEmail: string;

  @Column()
  fromName: string;

  @Column({ nullable: true })
  replyToEmail: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'json', nullable: true })
  advancedSettings: {
    connectionTimeout?: number;
    greetingTimeout?: number;
    socketTimeout?: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastTestedAt: Date;

  @Column({ 
    type: 'enum', 
    enum: ['success', 'failed'], 
    nullable: true 
  })
  testStatus: 'success' | 'failed';
}