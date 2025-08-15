import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Client } from '../../client/entities/client.entity';
import { Consultation } from '../../consultation/entities/consultation.entity';
import { InvoiceItem } from './invoice-item.entity';

export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'cancelled' | 'overdue';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'check' | 'other';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'consultation_id', nullable: true })
  consultationId: number;

  @Column({ name: 'client_id' })
  clientId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'invoice_number', unique: true })
  invoiceNumber: string;

  @Column({
    type: 'enum',
    enum: ['draft', 'pending', 'paid', 'cancelled', 'overdue'],
    default: 'draft',
  })
  status: InvoiceStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax: number;

  @Column({ name: 'tax_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ name: 'discount_type', enum: ['percentage', 'fixed'], default: 'percentage' })
  discountType: 'percentage' | 'fixed';

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({
    name: 'payment_method',
    type: 'enum',
    enum: ['cash', 'card', 'transfer', 'check', 'other'],
    nullable: true,
  })
  paymentMethod: PaymentMethod;

  @Column({ name: 'payment_date', type: 'datetime', nullable: true })
  paymentDate: Date;

  @Column({ name: 'due_date', type: 'datetime', nullable: true })
  dueDate: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'payment_notes', type: 'text', nullable: true })
  paymentNotes: string;

  @Column({ name: 'payment_reference', nullable: true })
  paymentReference: string;

  @Column({ name: 'is_paid', type: 'boolean', default: false })
  isPaid: boolean;

  @Column({ name: 'paid_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ name: 'remaining_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  remainingAmount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Client, { eager: true })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @ManyToOne(() => Consultation, { nullable: true })
  @JoinColumn({ name: 'consultation_id' })
  consultation: Consultation;

  @OneToMany(() => InvoiceItem, (item) => item.invoice, { cascade: true, eager: true })
  items: InvoiceItem[];

  // Métodos calculados
  calculateTotals() {
    this.subtotal = this.items.reduce((sum, item) => sum + Number(item.total), 0);
    
    if (this.discountType === 'percentage') {
      const discountAmount = (this.subtotal * this.discount) / 100;
      this.subtotal = this.subtotal - discountAmount;
    } else {
      this.subtotal = this.subtotal - this.discount;
    }

    this.tax = (this.subtotal * this.taxRate) / 100;
    this.total = this.subtotal + this.tax;
    this.remainingAmount = this.total - this.paidAmount;
  }
}