import { ApiProperty } from "@nestjs/swagger";

export class ProductOwnerResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  fullName: string; 
}