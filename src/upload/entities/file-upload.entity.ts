import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

export enum FileType {
  IMAGE = 'image',
  DOCUMENT = 'document',
  AVATAR = 'avatar',
  THUMBNAIL = 'thumbnail',
}

export enum EntityType {
  USER = 'user',
  CLIENT = 'client',
  PRODUCT = 'product',
  APPOINTMENT = 'appointment',
  CONSULTATION = 'consultation',
  GENERAL = 'general',
}

@Entity('file_upload')
export class FileUpload {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  filename: string;

  @Column()
  originalName: string;

  @Column()
  mimeType: string;

  @Column()
  size: number;

  @Column()
  path: string;

  @Column({ nullable: true })
  thumbnailPath?: string;

  @Column({
    type: 'enum',
    enum: FileType,
    default: FileType.IMAGE,
  })
  fileType: FileType;

  @Column({
    type: 'enum',
    enum: EntityType,
    default: EntityType.GENERAL,
  })
  entityType: EntityType;

  @Column({ nullable: true })
  entityId?: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => User)
  uploadedBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}