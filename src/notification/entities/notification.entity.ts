import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
  } from 'typeorm';
  import { User } from 'src/user/entities/user.entity';
  
  @Entity()
  export class Notification {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column()
    title: string;
  
    @Column()
    message: string;
  
    @Column({ default: false })
    read: boolean;
  
    @ManyToOne(() => User, { eager: true })
    user: User;
  
    @CreateDateColumn()
    createdAt: Date;
  }
  