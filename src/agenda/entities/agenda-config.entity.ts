import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
    ManyToMany,
    JoinTable,
  } from 'typeorm';
  import { User } from 'src/user/entities/user.entity';
  
  @Entity()
  export class AgendaConfig {
    @PrimaryGeneratedColumn()
    id: number;
  
    @OneToOne(() => User)
    @JoinColumn()
    user: User;
  
    @Column({ type: 'time' })
    startTime: string;
  
    @Column({ type: 'time' })
    endTime: string;
  
    @Column({ type: 'int', default: 15 }) // duración en minutos
    slotDuration: number;
  
    @Column({ default: false })
    overbookingAllowed: boolean;
  
    @Column({ default: false })
    allowBookingOnBlockedDays: boolean;
  
    @Column('simple-array') // Ej: ["monday", "tuesday", "wednesday"]
    workingDays: string[];
  }
  