import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn, // <-- IMPORTAR CreateDateColumn
  UpdateDateColumn, // <-- IMPORTAR UpdateDateColumn
} from 'typeorm';
import { Product } from 'src/product/entities/product.entity';
import { Client } from 'src/client/entities/client.entity';
import { Subscription } from 'src/subscription/entities/subscription.entity';
import { StockMovement } from 'src/stock/entities/stock-movement.entity';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password?: string; // Es opcional si se usa para sub-usuarios sin login directo inicial

  @Column()
  name: string; // Tu entidad usa 'name'

  @Column()
  lastName: string; // Tu entidad usa 'lastName'

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isAdmin: boolean;

  // --- NUEVOS CAMPOS DE PERMISOS ---
  @Column({ default: true })
  canManageAgenda: boolean;
  
  @Column({ default: true })
  canManageClients: boolean;

  @Column({ default: true })
  canManageProducts: boolean;
  
  @Column({ default: false })
  canManageUsers: boolean;

  // --- AÑADIR COLUMNAS DE FECHA ---
  @CreateDateColumn() // TypeORM manejará esto automáticamente al crear
  createdAt: Date;

  @UpdateDateColumn() // TypeORM manejará esto automáticamente al actualizar
  updatedAt: Date;
  // --- FIN DE COLUMNAS DE FECHA ---

  // --- RELACIONES ---
  @ManyToOne(() => User, (user) => user.subUsers, { nullable: true, onDelete: 'SET NULL' })
  owner?: User;

  @OneToMany(() => User, (user) => user.owner)
  subUsers: User[];

  @OneToMany(() => Subscription, (subscription) => subscription.user)
  subscriptions: Subscription[];

  @OneToMany(() => Product, (product) => product.owner)
  products: Product[];

  @OneToMany(() => Client, (client) => client.owner)
  clients: Client[];

   @OneToMany(() => StockMovement, (movement) => movement.user)
  stockMovements: StockMovement[];

  // --- PROPIEDAD COMPUTADA fullName ---
  get fullName(): string {
    return `${this.name} ${this.lastName}`.trim();
  }
}