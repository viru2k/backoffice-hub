import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BusinessType } from './business-type.entity';
import { Consultation } from '../../consultation/entities/consultation.entity';

@Entity('consultation_types')
export class ConsultationType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'business_type_id' })
  businessTypeId: number;

  @Column()
  name: string; // 'Consulta General', 'Terapia Individual', 'Chequeo Veterinario', etc.

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', default: 30 })
  defaultDuration: number; // Duración en minutos

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  defaultPrice: number;

  @Column({ type: 'json', nullable: true })
  customFields: Record<string, any>; // Campos específicos para este tipo de consulta

  @Column({ type: 'json', nullable: true })
  requiredFields: string[]; // Campos requeridos para este tipo de consulta

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => BusinessType, (businessType) => businessType.consultationTypes, { eager: true })
  @JoinColumn({ name: 'business_type_id' })
  businessType: BusinessType;

  @OneToMany(() => Consultation, (consultation) => consultation.consultationType)
  consultations: Consultation[];
}