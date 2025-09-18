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

export enum WeightUnit {
  GRAMS = 'g',
  KILOGRAMS = 'kg',
  POUNDS = 'lb',
  OUNCES = 'oz',
}

export enum DimensionUnit {
  CENTIMETERS = 'cm',
  INCHES = 'in',
  METERS = 'm',
}

export enum VolumeUnit {
  MILLILITERS = 'ml',
  LITERS = 'l',
  CUBIC_CENTIMETERS = 'cm3',
  CUBIC_METERS = 'm3',
}

@Entity('product_dimensions')
export class ProductDimensions {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  productId: number;

  @Column('decimal', { precision: 10, scale: 3, default: 0 })
  weight: number;

  @Column({ 
    type: 'enum', 
    enum: WeightUnit,
    default: WeightUnit.GRAMS
  })
  weightUnit: WeightUnit;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  length: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  width: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  height: number;

  @Column({ 
    type: 'enum', 
    enum: DimensionUnit,
    default: DimensionUnit.CENTIMETERS
  })
  dimensionUnit: DimensionUnit;

  @Column('decimal', { precision: 10, scale: 3, nullable: true })
  volume?: number;

  @Column({ 
    type: 'enum', 
    enum: VolumeUnit,
    default: VolumeUnit.MILLILITERS
  })
  volumeUnit: VolumeUnit;

  @OneToOne(() => Product)
  @JoinColumn()
  product: Product;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}