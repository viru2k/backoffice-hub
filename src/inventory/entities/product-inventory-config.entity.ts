import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../../product/entities/product.entity';

@Entity('product_inventory_config')
export class ProductInventoryConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  productId: number;

  @Column({ default: 0 })
  reorderPoint: number;

  @Column({ default: 0 })
  maxStockLevel: number;

  @Column({ default: 0 })
  minStockLevel: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  currentStock: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  reservedStock: number;

  @Column('decimal', { precision: 10, scale: 4, default: 0 })
  averageCost: number;

  @Column('decimal', { precision: 10, scale: 4, default: 0 })
  lastCost: number;

  @Column({ nullable: true })
  supplierId?: number;

  @Column({ default: true })
  isActive: boolean;

  @OneToOne(() => Product)
  @JoinColumn()
  product: Product;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}