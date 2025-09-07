import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class NotificationOperationDto {
  @ApiProperty()
  @Expose()
  message: string;

  @ApiProperty()
  @Expose()
  success: boolean;

  @ApiProperty()
  @Expose()
  timestamp: string;

  constructor(message: string, success: boolean = true) {
    this.message = message;
    this.success = success;
    this.timestamp = new Date().toISOString();
  }
}

export class WebSocketNotificationDto {
  @ApiProperty()
  @Expose()
  type: string;

  @ApiProperty()
  @Expose()
  title: string;

  @ApiProperty()
  @Expose()
  message: string;

  @ApiProperty()
  @Expose()
  timestamp: string;

  @ApiProperty()
  @Expose()
  userId?: number;

  @ApiProperty()
  @Expose()
  from?: string;
}

export class WebSocketTestResponseDto {
  @ApiProperty()
  @Expose()
  message: string;

  @ApiProperty({ type: WebSocketNotificationDto })
  @Expose()
  notification: WebSocketNotificationDto;

  @ApiProperty()
  @Expose()
  stats: any;
}

export class WebSocketStatsDto {
  @ApiProperty()
  @Expose()
  connectedClients: number;

  @ApiProperty()
  @Expose()
  totalConnections: number;

  @ApiProperty()
  @Expose()
  rooms: Record<string, number>;
}

export class FailedNotificationResponseDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  title: string;

  @ApiProperty()
  @Expose()
  message: string;

  @ApiProperty()
  @Expose()
  userId: number;

  @ApiProperty()
  @Expose()
  errorMessage?: string;

  @ApiProperty()
  @Expose()
  createdAt: string;
}