import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty, IsArray, ArrayNotEmpty, ArrayUnique, IsIn } from 'class-validator';
import { VALID_SERVICES } from 'src/common/constants/services';

export class RegisterUserDto {
  @ApiProperty({ example: 'admin@empresa.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'admin123' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ enum: ['monthly', 'semester', 'annual'], example: 'monthly' })
  @IsIn(['monthly', 'semester', 'annual'])
  subscriptionType: 'monthly' | 'semester' | 'annual';

  @ApiProperty({ type: [String], example: ['agenda', 'inventory'] })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsIn(VALID_SERVICES, { each: true })
  services: string[];
}
