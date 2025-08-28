import { ApiProperty, PartialType } from '@nestjs/swagger';
import { 
  IsString, 
  MinLength, 
  IsOptional, 
  IsEnum, 
  IsArray, 
  IsBoolean, 
  IsObject 
} from 'class-validator';
import { EmailTemplateType } from '../entities/email-template.entity';

export class CreateEmailTemplateDto {
  @IsString()
  @MinLength(1)
  @ApiProperty()
  name: string;

  @IsString()
  @MinLength(1)
  @ApiProperty()
  subject: string;

  @IsString()
  @MinLength(1)
  @ApiProperty()
  htmlContent: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  textContent?: string;

  @IsEnum(EmailTemplateType)
  @ApiProperty({ enum: EmailTemplateType })
  type: EmailTemplateType;

  @IsArray()
  @IsString({ each: true })
  @ApiProperty()
  variables: string[];

  @IsBoolean()
  @ApiProperty()
  isActive: boolean;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  description?: string;

  @IsObject()
  @IsOptional()
  @ApiProperty({ required: false })
  metadata?: Record<string, any>;
}

export class UpdateEmailTemplateDto extends PartialType(CreateEmailTemplateDto) {}

export class EmailTemplateResponseDto extends CreateEmailTemplateDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  createdBy: string;

  @ApiProperty()
  usageCount: number;

  @ApiProperty({ required: false })
  lastUsed?: Date;
}