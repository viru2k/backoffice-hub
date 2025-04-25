import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
  } from 'typeorm';
  import { Product } from 'src/product/entities/product.entity';
  import { User } from 'src/user/entities/user.entity';
  
  @Entity()
  export class StockMovement {
    @PrimaryGeneratedColumn()
    id: number;
  
    @ManyToOne(() => Product, { eager: true })
    product: Product;
  
    @Column()
    productNameAtTime: string; // Se copia del producto al momento del movimiento
  
    @Column('int')
    quantity: number;
  
    @Column({ type: 'enum', enum: ['in', 'out', 'adjustment', 'usage'] })
    type: 'in' | 'out' | 'adjustment' | 'usage';
  
    @Column({ nullable: true })
    reason?: string;
  
    @ManyToOne(() => User, { eager: true })
    user: User;
  
    @CreateDateColumn()
    createdAt: Date;
  }
  
  