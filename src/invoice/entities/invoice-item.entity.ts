import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Invoice } from './invoice.entity';
import { Product } from '../../product/entities/product.entity';
// import { Service } from '../../service/entities/service.entity'; // TODO: Uncomment when service entity exists

export type InvoiceItemType = 'service' | 'product';

@Entity('invoice_items')
export class InvoiceItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'invoice_id' })
  invoiceId: number;

  @Column({
    name: 'item_type',
    type: 'enum',
    enum: ['service', 'product'],
  })
  itemType: InvoiceItemType;

  @Column({ name: 'item_id' })
  itemId: number;

  @Column()
  description: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ name: 'discount_type', enum: ['percentage', 'fixed'], default: 'percentage' })
  discountType: 'percentage' | 'fixed';

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => Invoice, (invoice) => invoice.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @ManyToOne(() => Product, { nullable: true, eager: true })
  @JoinColumn({ name: 'item_id' })
  product: Product;

  // @ManyToOne(() => Service, { nullable: true, eager: true })
  // @JoinColumn({ name: 'item_id' })
  // service: Service; // TODO: Uncomment when service entity exists

  // Métodos calculados
  calculateTotal() {
    const subtotal = this.quantity * Number(this.unitPrice);
    
    if (this.discountType === 'percentage') {
      const discountAmount = (subtotal * this.discount) / 100;
      this.total = subtotal - discountAmount;
    } else {
      this.total = subtotal - this.discount;
    }
  }
}