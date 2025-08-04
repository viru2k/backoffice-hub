import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsNumber } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ description: 'Unique name of the role', example: 'Admin' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Description of the role', example: 'Full administrative access' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Array of permission IDs to assign to this role', type: [Number], example: [1, 2, 3] })
  @IsArray()
  @IsNumber({},{each: true})
  @IsOptional()
  permissionIds?: number[];
}
