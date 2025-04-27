import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Subscription } from '../../subscription/entities/subscription.entity';
import { Product } from './../../product/entities/product.entity';
import { StockMovement } from './../../stock/entities/stock-movement.entity';
import { Client } from './../../client/entities/client.entity';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  fullName: string;

  @Column({ default: false })
  isAdmin: boolean; // Solo si quieres mantener lógica de admin simple (true/false)

  @Column({ default: true })
  isActive: boolean; // Usamos este como estado del usuario

  // --- Relación para subusuarios ---
  @ManyToOne(() => User, (user) => user.subUsers, { nullable: true })
  owner: User; // <<< El "dueño" del usuario (para multiusuario por cuenta)

  @OneToMany(() => User, (user) => user.owner)
  subUsers: User[];

  // --- Relación con suscripciones ---
  @OneToMany(() => Subscription, (subscription) => subscription.user)
  subscriptions: Subscription[];

  @OneToMany(() => Product, (product) => product.user)
products: Product[];

@OneToMany(() => StockMovement, (movement) => movement.user)
stockMovements: StockMovement[];

@OneToMany(() => Client, (client) => client.user)
clients: Client[];
}
