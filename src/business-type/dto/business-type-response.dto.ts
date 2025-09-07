import { ApiProperty } from '@nestjs/swagger';
import { ConsultationTypeResponseDto } from './consultation-type-response.dto';

export class BusinessTypeResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  iconName?: string;

  @ApiProperty({ required: false })
  colorScheme?: string;

  @ApiProperty({ required: false })
  defaultFields?: Record<string, any>;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ type: [ConsultationTypeResponseDto], required: false })
  consultationTypes?: ConsultationTypeResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}