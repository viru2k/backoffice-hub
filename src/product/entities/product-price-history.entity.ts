import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity()
export class ProductPriceHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Product, product => product.priceHistory)
  product: Product;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @CreateDateColumn()
  changedAt: Date;
}
