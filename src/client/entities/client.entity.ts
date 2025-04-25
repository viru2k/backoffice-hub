import { User } from "src/user/entities/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Client {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fullname: string; // nombre completo para búsqueda rápida

  @Column()
  name: string;

  @Column()
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

  @Column({ default: 'ACTIVE' })
  status: 'ACTIVE' | 'INACTIVE' | 'UNUSED' | 'CREATED';

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @ManyToOne(() => User, { eager: true })
  owner: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
