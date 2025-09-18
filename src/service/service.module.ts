import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceService } from './service.service';
import { ServiceController } from './service.controller';
import { ServiceItemsController } from './service-items.controller';
import { Service } from './entities/service.entity';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [TypeOrmModule.forFeature([Service]), ProductModule],
  providers: [ServiceService],
  controllers: [ServiceController, ServiceItemsController],
  exports: [ServiceService]
})
export class ServiceModule {}
