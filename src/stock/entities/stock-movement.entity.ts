import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
  } from 'typeorm';
  import { Product } from './../../product/entities/product.entity';
  import { User } from './../../user/entities/user.entity';
  
  export enum StockMovementType {
    IN = 'in',
    OUT = 'out',
    ADJUSTMENT = 'adjustment',
    USAGE = 'usage',
  }
  
  @Entity()
  export class StockMovement {

    
    @PrimaryGeneratedColumn()
    id: number;

  
    @Column()
    productNameAtTime: string; // Se copia del producto al momento del movimiento
  
    @Column('int')
    quantity: number;
  
    @Column({ type: 'enum', enum: ['in', 'out', 'adjustment', 'usage'] })
    type: 'in' | 'out' | 'adjustment' | 'usage';
  
    @Column({ nullable: true })
    reason?: string;
 
    @ManyToOne(() => Product, (product) => product.stockMovements, { onDelete: 'CASCADE' })
    product: Product;
  
    @ManyToOne(() => User, (user) => user.stockMovements, { onDelete: 'CASCADE' })
    user: User;
 
    @Column({ type: 'datetime' })
    date: Date;

    @CreateDateColumn()
    createdAt: Date;
  }
  
  