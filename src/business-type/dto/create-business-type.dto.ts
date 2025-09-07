import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsObject, MinLength } from 'class-validator';

export class CreateBusinessTypeDto {
  @IsString()
  @MinLength(1)
  @ApiProperty()
  code: string;

  @IsString()
  @MinLength(1)
  @ApiProperty()
  name: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  description?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  iconName?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  colorScheme?: string;

  @IsOptional()
  @IsObject()
  @ApiProperty({ required: false })
  defaultFields?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ default: true, required: false })
  isActive?: boolean;
}

export class UpdateBusinessTypeDto extends PartialType(CreateBusinessTypeDto) {}