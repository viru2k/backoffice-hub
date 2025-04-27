import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CreateSubscriptionPlanFeatureDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  feature: string;

  @ApiProperty()
  @IsBoolean()
  enabled: boolean;
}
