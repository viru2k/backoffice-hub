import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ConsultationOperationResultDto {
  @ApiProperty()
  @Expose()
  success: boolean;

  @ApiProperty()
  @Expose()
  message: string;

  @ApiProperty()
  @Expose()
  timestamp: string;

  constructor(message: string, success: boolean = true) {
    this.success = success;
    this.message = message;
    this.timestamp = new Date().toISOString();
  }
}