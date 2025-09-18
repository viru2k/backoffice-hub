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

@Entity('product_packaging')
export class ProductPackaging {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  productId: number;

  @Column({ length: 100 })
  baseUnit: string; // unidad, caja, ampolla, frasco

  @Column({ default: 1 })
  unitsPerPackage: number; // ej: 6 ampollas por caja

  @Column({ length: 100 })
  packageType: string; // caja, blister, frasco, botella

  @Column({ default: 1 })
  minOrderQuantity: number;

  @Column({ length: 200, nullable: true })
  storageRequirements?: string; // refrigerado, ambiente

  @Column({ nullable: true })
  expirationMonths?: number;

  @Column({ length: 50, nullable: true })
  barcode?: string;

  @Column({ length: 50, unique: true })
  internalSku: string;

  @Column({ length: 50, nullable: true })
  supplierSku?: string;

  @OneToOne(() => Product)
  @JoinColumn()
  product: Product;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}