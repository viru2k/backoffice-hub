import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { ProductPriceHistory } from './product-price-history.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: 'activo' })
  status: 'activo' | 'inactivo' | 'descatalogado' | 'agotado' | 'suspendido';

  @Column('decimal', { precision: 10, scale: 2 })
  currentPrice: number;

  @ManyToOne(() => User, { eager: true })
  owner: User;

  @OneToMany(() => ProductPriceHistory, history => history.product)
  priceHistory: ProductPriceHistory[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

