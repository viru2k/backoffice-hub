import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ConsultationType } from './consultation-type.entity';

@Entity('business_types')
export class BusinessType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string; // 'psychology', 'veterinary', 'office', 'beauty', 'hair_salon'

  @Column()
  name: string; // 'Psicología', 'Veterinaria', 'Atención de Oficina', 'Belleza', 'Peluquería'

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'icon_name', nullable: true })
  iconName: string; // Para íconos en el frontend

  @Column({ name: 'color_scheme', nullable: true })
  colorScheme: string; // Esquema de colores para el frontend

  @Column({ type: 'json', nullable: true })
  defaultFields: Record<string, any>; // Campos específicos por defecto para este tipo de negocio

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relaciones
  @OneToMany(() => ConsultationType, (consultationType) => consultationType.businessType)
  consultationTypes: ConsultationType[];
}