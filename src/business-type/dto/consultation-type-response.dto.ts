import { ApiProperty } from '@nestjs/swagger';

export class ConsultationTypeResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  businessTypeId: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  defaultDuration: number;

  @ApiProperty({ required: false })
  defaultPrice?: number;

  @ApiProperty({ required: false })
  customFields?: Record<string, any>;

  @ApiProperty({ required: false })
  requiredFields?: string[];

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}