import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class EmailOperationResultDto {
  @ApiProperty()
  @Expose()
  success: boolean;

  @ApiProperty()
  @Expose()
  message: string;

  @ApiProperty()
  @Expose()
  timestamp: string;

  @ApiProperty({ required: false })
  @Expose()
  operation?: string;

  constructor(message: string, success: boolean = true, operation?: string) {
    this.success = success;
    this.message = message;
    this.timestamp = new Date().toISOString();
    this.operation = operation;
  }
}