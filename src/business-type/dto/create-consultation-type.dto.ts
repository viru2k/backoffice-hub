import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsObject, MinLength, IsNumber, IsArray, Min } from 'class-validator';

export class CreateConsultationTypeDto {
  @IsNumber()
  @ApiProperty()
  businessTypeId: number;

  @IsString()
  @MinLength(1)
  @ApiProperty()
  name: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @ApiProperty({ default: 30, required: false })
  defaultDuration?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @ApiProperty({ required: false })
  defaultPrice?: number;

  @IsOptional()
  @IsObject()
  @ApiProperty({ required: false })
  customFields?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ type: [String], required: false })
  requiredFields?: string[];

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ default: true, required: false })
  isActive?: boolean;
}

export class UpdateConsultationTypeDto extends PartialType(CreateConsultationTypeDto) {}