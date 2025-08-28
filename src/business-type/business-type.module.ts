import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessType } from './entities/business-type.entity';
import { ConsultationType } from './entities/consultation-type.entity';
import { BusinessTypeController } from './business-type.controller';
import { BusinessTypePublicController } from './business-type-public.controller';
import { BusinessTypeService } from './business-type.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BusinessType,
      ConsultationType,
    ]),
  ],
  controllers: [BusinessTypeController, BusinessTypePublicController],
  providers: [BusinessTypeService],
  exports: [TypeOrmModule, BusinessTypeService],
})
export class BusinessTypeModule {}