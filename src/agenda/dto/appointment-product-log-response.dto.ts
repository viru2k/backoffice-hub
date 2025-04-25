import { ApiProperty } from '@nestjs/swagger';

export class AppointmentProductLogResponseDto {
  @ApiProperty()
  productId: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  priceAtTime: number;

  @ApiProperty()
  usedAt: string;
}
