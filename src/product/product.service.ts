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

  async create(dto: CreateProductDto, user: User): Promise<Product> { // Return Product
    const productEntity = this.productRepo.create({
      ...dto,
      owner: user, // Ensure owner is the User entity
      user: user, // Assuming 'user' relationship also needs to be set
      currentPrice: dto.price,
    });
    const savedProduct = await this.productRepo.save(productEntity);
    return savedProduct; // Return the saved Product entity
  }

  async findAll(userId: number): Promise<Product[]> { // Return array of Product
    return this.productRepo.find({ 
      where: { owner: { id: userId } },
      relations: ['owner']
    });
  }

  async findOne(id: number, userId: number): Promise<Product> { // Return Product entity
    const product = await this.productRepo.findOne({
      where: { id, owner: { id: userId } },
      relations: ['owner'], 
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }
    return product; // Return the Product entity
  }

  async update(id: number, dto: UpdateProductDto, userId: number): Promise<Product> { 
    const product = await this.findOne(id, userId); 
  
    if (dto.price && dto.price !== product.currentPrice) {
      await this.priceHistoryRepo.save({
        product, 
        price: dto.price,
   
      });
  
      product.currentPrice = dto.price; 
    }
    const { price, ...otherDtoProps } = dto;
    Object.assign(product, otherDtoProps);
  
    const updatedProduct = await this.productRepo.save(product);
    return this.findOne(updatedProduct.id, userId);
  }
  

  async remove(id: number, userId: number): Promise<Product> {
    const product = await this.findOne(id, userId); 
    if (!product) { // 
        throw new NotFoundException('Producto no encontrado para eliminar');
    }
    return this.productRepo.remove(product);
  }

  async toggleStatus(id: number, userId: number): Promise<Product> { 
    const product = await this.findOne(id, userId); 
  
    product.status = product.status === 'activo' ? 'inactivo' : 'activo';
  
    const savedProduct = await this.productRepo.save(product);
    return this.findOne(savedProduct.id, userId);
  }
}