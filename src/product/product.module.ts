import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { ProductPriceHistory } from './entities/product-price-history.entity';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [ TypeOrmModule.forFeature([Product, ProductPriceHistory]),
    UserModule],
  providers: [ProductService],
  controllers: [ProductController],
  exports: [TypeOrmModule],
})
export class ProductModule {}
