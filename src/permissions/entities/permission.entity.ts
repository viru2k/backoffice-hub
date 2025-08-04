import { Role } from '../../roles/entities/role.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';


@Entity()
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string; // ej. 'agenda:read:group'

  @Column()
  description: string;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];
}