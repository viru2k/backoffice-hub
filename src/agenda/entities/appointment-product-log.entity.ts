import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
  } from 'typeorm';
  import { Appointment } from './appointment.entity';
  import { Product } from 'src/product/entities/product.entity';
  
  @Entity()
  export class AppointmentProductLog {
    @PrimaryGeneratedColumn()
    id: number;
  
    @ManyToOne(() => Appointment, { eager: false })
    appointment: Appointment;
  
    @ManyToOne(() => Product, { eager: true })
    product: Product;
  
    @Column('int')
    quantity: number;
  
    @Column('decimal', { precision: 10, scale: 2 })
    priceAtTime: number;
  
    @CreateDateColumn()
    usedAt: Date;
  }
  