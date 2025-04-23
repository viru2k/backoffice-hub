import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
  } from 'typeorm';
  
  @Entity()
  export class FailedNotification {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column()
    userId: number;
  
    @Column()
    title: string;
  
    @Column()
    message: string;
  
    @Column()
    error: string;
  
    @CreateDateColumn()
    createdAt: Date;
  }
  