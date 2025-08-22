import { PartialType } from '@nestjs/mapped-types';
import { CreateRewardProgramDto } from './create-reward-program.dto';

export class UpdateRewardProgramDto extends PartialType(CreateRewardProgramDto) {}