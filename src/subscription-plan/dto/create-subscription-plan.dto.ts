import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSubscriptionPlanDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsNumber()
  priceMonthly: number;

  @ApiProperty()
  @IsNumber()
  priceSemiannual: number;

  @ApiProperty()
  @IsNumber()
  priceAnnual: number;

  @ApiProperty()
  @IsNumber()
  maxUsers: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
