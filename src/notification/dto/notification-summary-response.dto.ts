import { ApiProperty } from '@nestjs/swagger';

export class NotificationSummaryResponseDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  unread: number;
}
