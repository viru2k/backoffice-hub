import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { User } from 'src/user/entities/user.entity';
import { ProductPriceHistory } from './entities/product-price-history.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductPriceHistory)
    private readonly priceHistoryRepo: Repository<ProductPriceHistory>,
  ) {}

  async create(dto: CreateProductDto, user: User) {
    const product = this.productRepo.create({
      ...dto,
      owner: user,
    });
    return this.productRepo.save(product);
  }

  async findAll(userId: number) {
    return this.productRepo.find({ where: { owner: { id: userId } } });
  }

  async findOne(id: number, userId: number) {
    const product = await this.productRepo.findOne({
      where: { id, owner: { id: userId } },
    });

    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async update(id: number, dto: UpdateProductDto, userId: number) {
    const product = await this.findOne(id, userId);
  
    // 👉 Si el precio cambió, guardamos en el historial
    if (dto.price && dto.price !== product.currentPrice) {
      await this.priceHistoryRepo.save({
        product,
        price: dto.price,
      });
  
      product.currentPrice = dto.price; // Actualizamos precio actual
    }
  
    Object.assign(product, {
      ...dto,
      // evitamos sobrescribir currentPrice si se actualizó arriba
      ...(dto.price ? {} : { currentPrice: product.currentPrice }),
    });
  
    return this.productRepo.save(product);
  }
  

  async remove(id: number, userId: number) {
    const product = await this.findOne(id, userId);
    return this.productRepo.remove(product);
  }

  async toggleStatus(id: number, userId: number) {
    const product = await this.findOne(id, userId);
  
    product.status = product.status === 'activo' ? 'inactivo' : 'activo';
  
    return this.productRepo.save(product);
  }
  
}
