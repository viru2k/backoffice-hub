import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConsultationStatus } from '../entities/consultation.entity';

export class ConsultationResponseDto {
  @ApiProperty()
  id: number;

  @ApiPropertyOptional()
  appointmentId?: number;

  @ApiProperty()
  clientId: number;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  consultationNumber: string;

  @ApiProperty({ enum: ['pending', 'in_progress', 'completed', 'cancelled'] })
  status: ConsultationStatus;

  @ApiPropertyOptional()
  startTime?: Date;

  @ApiPropertyOptional()
  endTime?: Date;

  @ApiPropertyOptional()
  notes?: string;

  @ApiPropertyOptional()
  symptoms?: string;

  @ApiPropertyOptional()
  diagnosis?: string;

  @ApiPropertyOptional()
  treatment?: string;

  @ApiPropertyOptional()
  recommendations?: string;

  @ApiPropertyOptional()
  nextAppointment?: Date;

  @ApiPropertyOptional()
  weight?: number;

  @ApiPropertyOptional()
  height?: number;

  @ApiPropertyOptional()
  bloodPressure?: string;

  @ApiPropertyOptional()
  temperature?: number;

  @ApiPropertyOptional()
  heartRate?: number;

  @ApiPropertyOptional()
  vitals?: Record<string, any>;

  @ApiPropertyOptional()
  allergies?: string[];

  @ApiPropertyOptional()
  medications?: string[];

  @ApiPropertyOptional()
  followUpRequired?: boolean;

  @ApiPropertyOptional()
  followUpDate?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  client?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };

  @ApiPropertyOptional()
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };

  @ApiPropertyOptional()
  appointment?: {
    id: number;
    date: Date;
    startTime: string;
    endTime: string;
  };

  @ApiPropertyOptional()
  files?: {
    id: number;
    originalName: string;
    fileType: string;
    size: number;
    path: string;
    thumbnailPath?: string;
  }[];

  @ApiPropertyOptional()
  invoices?: {
    id: number;
    invoiceNumber: string;
    status: string;
    total: number;
    isPaid: boolean;
  }[];
}