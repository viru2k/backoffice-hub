import { ApiProperty, PartialType } from '@nestjs/swagger';
import { 
  IsEnum, 
  IsString, 
  IsNumber, 
  Min, 
  Max, 
  IsBoolean, 
  IsEmail, 
  MinLength, 
  IsOptional, 
  IsObject 
} from 'class-validator';

export class EmailSettingsDto {
  @IsEnum(['gmail', 'outlook', 'yahoo', 'custom'])
  @ApiProperty({ enum: ['gmail', 'outlook', 'yahoo', 'custom'] })
  provider: 'gmail' | 'outlook' | 'yahoo' | 'custom';

  @IsString()
  @ApiProperty()
  smtpHost: string;

  @IsNumber()
  @Min(1)
  @Max(65535)
  @ApiProperty()
  smtpPort: number;

  @IsBoolean()
  @ApiProperty()
  smtpSecure: boolean;

  @IsEmail()
  @ApiProperty()
  smtpUser: string;

  @IsString()
  @MinLength(1)
  @ApiProperty()
  smtpPassword: string;

  @IsEmail()
  @ApiProperty()
  fromEmail: string;

  @IsString()
  @MinLength(1)
  @ApiProperty()
  fromName: string;

  @IsEmail()
  @IsOptional()
  @ApiProperty({ required: false })
  replyToEmail?: string;

  @IsBoolean()
  @ApiProperty()
  isActive: boolean;

  @IsObject()
  @IsOptional()
  @ApiProperty({ required: false })
  advancedSettings?: {
    connectionTimeout?: number;
    greetingTimeout?: number;
    socketTimeout?: number;
  };
}

export class UpdateEmailSettingsDto extends PartialType(EmailSettingsDto) {}

export class EmailSettingsResponseDto extends EmailSettingsDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false })
  lastTestedAt?: Date;

  @ApiProperty({ enum: ['success', 'failed'], required: false })
  testStatus?: 'success' | 'failed';

  // Ocultar contraseña en respuestas
  smtpPassword: string = '***HIDDEN***';
}

export class TestConnectionResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty({ required: false })
  error?: string;

  @ApiProperty()
  testedAt: Date;
}