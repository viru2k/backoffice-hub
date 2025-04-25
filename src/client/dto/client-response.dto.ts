import { ApiProperty } from '@nestjs/swagger';

export class ClientResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  fullname: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ required: false })
  address?: string;

  @ApiProperty({ required: false })
  email?: string;

  @ApiProperty({ required: false })
  phone?: string;

  @ApiProperty({ enum: ['male', 'female', 'other'], required: false })
  gender?: 'male' | 'female' | 'other';

  @ApiProperty({ required: false })
  birthDate?: string;

  @ApiProperty()
  status: 'ACTIVE'| 'INACTIVE'| 'CREATED';

  @ApiProperty({ required: false })
  notes?: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
