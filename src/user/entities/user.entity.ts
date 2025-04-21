import { Subscription } from 'src/subscription/entities/subscription.entity';
import {
    Entity, PrimaryGeneratedColumn, Column, ManyToOne,
    OneToMany, CreateDateColumn
  } from 'typeorm';

  
  @Entity()
  export class User {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({ unique: true })
    email: string;
  
    @Column()
    password: string;
  
    @Column({ default: false })
    isAdmin: boolean;
  
    @ManyToOne(() => User, (user) => user.subUsers, { nullable: true })
    owner: User;
  
    @OneToMany(() => User, (user) => user.owner)
    subUsers: User[];
  
    @ManyToOne(() => Subscription, { eager: true })
    subscription: Subscription;
  
    @Column({ default: true })
    isActive: boolean;
  
    @CreateDateColumn()
    createdAt: Date;
  }
  