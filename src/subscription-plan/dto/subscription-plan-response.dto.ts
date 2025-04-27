import { ApiProperty } from '@nestjs/swagger';

export class SubscriptionPlanFeatureResponseDto {
  @ApiProperty()
  feature: string;

  @ApiProperty()
  enabled: boolean;
}

export class SubscriptionPlanResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  priceMonthly: number;

  @ApiProperty()
  priceSemiannual: number;

  @ApiProperty()
  priceAnnual: number;

  @ApiProperty()
  maxUsers: number;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ type: [SubscriptionPlanFeatureResponseDto] })
  features: SubscriptionPlanFeatureResponseDto[];
}
