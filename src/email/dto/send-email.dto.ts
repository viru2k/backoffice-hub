import { ApiProperty } from '@nestjs/swagger';
import { 
  IsArray, 
  IsEmail, 
  IsString, 
  MinLength, 
  IsOptional, 
  IsEnum, 
  IsBoolean, 
  IsObject,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class EmailAttachmentDto {
  @IsString()
  @ApiProperty()
  filename: string;

  @IsString()
  @ApiProperty()
  content: string; // Base64

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  contentType?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ enum: ['attachment', 'inline'], required: false })
  disposition?: 'attachment' | 'inline';
}

export class SendEmailDto {
  @IsArray()
  @IsEmail({}, { each: true })
  @ApiProperty()
  to: string[];

  @IsArray()
  @IsEmail({}, { each: true })
  @IsOptional()
  @ApiProperty({ required: false })
  cc?: string[];

  @IsArray()
  @IsEmail({}, { each: true })
  @IsOptional()
  @ApiProperty({ required: false })
  bcc?: string[];

  @IsString()
  @MinLength(1)
  @ApiProperty()
  subject: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  htmlContent?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  textContent?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailAttachmentDto)
  @IsOptional()
  @ApiProperty({ type: [EmailAttachmentDto], required: false })
  attachments?: EmailAttachmentDto[];

  @IsEnum(['low', 'normal', 'high'])
  @IsOptional()
  @ApiProperty({ enum: ['low', 'normal', 'high'], required: false })
  priority?: string;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ required: false })
  trackOpens?: boolean;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ required: false })
  trackClicks?: boolean;
}

export class SendTemplateEmailDto {
  @IsArray()
  @IsEmail({}, { each: true })
  @ApiProperty()
  to: string[];

  @IsString()
  @ApiProperty()
  templateId: string;

  @IsObject()
  @IsOptional()
  @ApiProperty({ required: false })
  templateVariables?: Record<string, any>;

  @IsArray()
  @IsEmail({}, { each: true })
  @IsOptional()
  @ApiProperty({ required: false })
  cc?: string[];

  @IsArray()
  @IsEmail({}, { each: true })
  @IsOptional()
  @ApiProperty({ required: false })
  bcc?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailAttachmentDto)
  @IsOptional()
  @ApiProperty({ type: [EmailAttachmentDto], required: false })
  attachments?: EmailAttachmentDto[];
}

export class BulkEmailRecipientDto {
  @IsEmail()
  @ApiProperty()
  email: string;

  @IsObject()
  @IsOptional()
  @ApiProperty({ required: false })
  variables?: Record<string, any>;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  name?: string;
}

export class BulkEmailDto {
  @IsString()
  @ApiProperty()
  templateId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkEmailRecipientDto)
  @ApiProperty({ type: [BulkEmailRecipientDto] })
  recipients: BulkEmailRecipientDto[];

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ required: false })
  scheduleDelivery?: boolean;

  @IsDateString()
  @IsOptional()
  @ApiProperty({ required: false })
  scheduledAt?: string;
}

export class EmailSendResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  messageId: string;

  @ApiProperty()
  logId: string;

  @ApiProperty({ required: false })
  error?: string;
}

export class BulkEmailResponseDto {
  @ApiProperty()
  totalRecipients: number;

  @ApiProperty()
  successfulSends: number;

  @ApiProperty()
  failedSends: number;

  @ApiProperty()
  logIds: string[];

  @ApiProperty({ required: false })
  errors?: string[];
}