import { ApiProperty } from '@nestjs/swagger';
import { 
  IsOptional, 
  IsEnum, 
  IsDateString, 
  IsString, 
  IsNumber, 
  Min, 
  Max 
} from 'class-validator';
import { EmailStatus } from '../entities/email-log.entity';

export class EmailLogResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  to: string[];

  @ApiProperty({ required: false })
  cc?: string[];

  @ApiProperty({ required: false })
  bcc?: string[];

  @ApiProperty()
  subject: string;

  @ApiProperty({ enum: EmailStatus })
  status: EmailStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ required: false })
  sentAt?: Date;

  @ApiProperty({ required: false })
  failedAt?: Date;

  @ApiProperty({ required: false })
  errorMessage?: string;

  @ApiProperty({ required: false })
  templateUsed?: string;

  @ApiProperty({ required: false })
  userId?: string;

  @ApiProperty({ required: false })
  relatedEntity?: {
    type: string;
    id: string;
  };

  @ApiProperty({ required: false })
  deliveryStats?: {
    opens: number;
    clicks: number;
    bounces: number;
  };
}

export class EmailLogsQueryDto {
  @IsOptional()
  @IsEnum(EmailStatus)
  @ApiProperty({ enum: EmailStatus, required: false })
  status?: EmailStatus;

  @IsOptional()
  @IsDateString()
  @ApiProperty({ required: false })
  startDate?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({ required: false })
  endDate?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  templateId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @ApiProperty({ required: false, default: 1 })
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @ApiProperty({ required: false, default: 20 })
  limit?: number = 20;
}

export class EmailLogsPaginatedResponseDto {
  @ApiProperty({ type: [EmailLogResponseDto] })
  data: EmailLogResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class EmailMetricsResponseDto {
  @ApiProperty()
  totalSent: number;

  @ApiProperty()
  totalFailed: number;

  @ApiProperty()
  totalPending: number;

  @ApiProperty()
  successRate: number;

  @ApiProperty()
  averageDeliveryTime: number; // en segundos

  @ApiProperty()
  topTemplates: {
    id: string;
    name: string;
    count: number;
    successRate: number;
  }[];

  @ApiProperty()
  dailyStats: {
    date: string;
    sent: number;
    failed: number;
    pending: number;
  }[];

  @ApiProperty()
  hourlyDistribution: {
    hour: number;
    count: number;
  }[];

  @ApiProperty()
  errorAnalysis: {
    error: string;
    count: number;
    percentage: number;
  }[];
}

export class EmailMetricsSummaryDto {
  @ApiProperty()
  todaysSent: number;

  @ApiProperty()
  todaysFailed: number;

  @ApiProperty()
  weeklySuccessRate: number;

  @ApiProperty()
  activeTemplates: number;

  @ApiProperty()
  queuedEmails: number;
}

export class DateRangeQueryDto {
  @IsOptional()
  @IsDateString()
  @ApiProperty({ required: false })
  startDate?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({ required: false })
  endDate?: string;
}