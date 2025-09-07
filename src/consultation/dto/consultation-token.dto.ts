import { IsString, IsArray, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { Expose, Type } from 'class-transformer';

export class CreateConsultationTokenDto {
  @IsOptional()
  @IsArray()
  allowedActions?: string[] = ['view', 'download'];

  @IsOptional()
  @IsString()
  customMessage?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: Date;
}

export class ConsultationTokenResponseDto {
  @Expose()
  id: number;

  @Expose()
  token: string;

  @Expose()
  status: string;

  @Expose()
  expiresAt: Date;

  @Expose()
  usedAt: Date;

  @Expose()
  allowedActions: string[];

  @Expose()
  customMessage: string;

  @Expose()
  createdAt: Date;

  @Expose()
  get isExpired(): boolean {
    return new Date() > new Date(this.expiresAt);
  }

  @Expose()
  get isValid(): boolean {
    return this.status === 'ACTIVE' && !this.isExpired;
  }
}

export class PublicConsultationDto {
  @Expose()
  id: number;

  @Expose()
  consultationNumber: string;

  @Expose()
  status: string;

  @Expose()
  startTime: Date;

  @Expose()
  endTime: Date;

  @Expose()
  diagnosis: string;

  @Expose()
  treatment: string;

  @Expose()
  recommendations: string;

  @Expose()
  nextAppointment: Date;

  @Expose()
  followUpRequired: boolean;

  @Expose()
  followUpDate: Date;

  @Expose()
  customMessage: string;

  @Expose()
  clientName: string;

  @Expose()
  doctorName: string;

  @Expose()
  consultationType: string;
}