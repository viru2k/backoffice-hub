import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { Product } from '../product/entities/product.entity';
import { StockMovement } from '../stock/entities/stock-movement.entity';
import { ProductDimensions } from './entities/product-dimensions.entity';
import { ProductPackaging } from './entities/product-packaging.entity';
import { ProductInventoryConfig } from './entities/product-inventory-config.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product, 
      StockMovement,
      ProductDimensions,
      ProductPackaging,
      ProductInventoryConfig
    ])
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}