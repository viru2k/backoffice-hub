import { ApiProperty } from '@nestjs/swagger';

export class SubscriptionResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  durationInMonths: number;

  @ApiProperty()
  price: number;
}
