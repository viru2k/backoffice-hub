import { ApiProperty } from '@nestjs/swagger';
import { ProductOwnerResponseDto } from './product-owner-response.dto';

export class ProductResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ enum: ['activo', 'inactivo', 'descatalogado', 'agotado', 'suspendido'] })
  status: string;

  @ApiProperty()
  currentPrice: number;

  @ApiProperty({ required: false, description: 'Avatar URL or null if no image' })
  avatarUrl?: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

   @ApiProperty({ type: ProductOwnerResponseDto }) 
  owner: ProductOwnerResponseDto;
}
