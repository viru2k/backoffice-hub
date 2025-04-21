import {
    Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn
  } from 'typeorm';
  import { User } from 'src/user/entities/user.entity';
  
  @Entity()
  export class Subscription {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column()
    name: string; // Ej: "Plan agenda + stock"
  
    @Column()
    type: 'monthly' | 'semester' | 'annual';
  
    @Column('simple-array')
    services: string[]; // Ej: ['agenda', 'inventory']
  
    @Column()
    startDate: Date;
  
    @Column()
    endDate: Date;
  
    @OneToMany(() => User, (user) => user.subscription)
    users: User[];
  
    @CreateDateColumn()
    createdAt: Date;
  }
  