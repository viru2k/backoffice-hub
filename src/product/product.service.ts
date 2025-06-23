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

async create(dto: CreateProductDto, user: User): Promise<Product> {
    const productEntity = this.productRepo.create({
      ...dto,
      owner: user,
      user: user, // Asumiendo que ambas relaciones apuntan al mismo usuario
      currentPrice: dto.price,
    });
    const savedProduct = await this.productRepo.save(productEntity);
    return this.findOne(savedProduct.id, user, user.id); // Re-fetch para cargar relaciones
  }

async findAll(requestingUser: User, targetUserId: number): Promise<Product[]> {
    return this.productRepo.find({
      where: { owner: { id: targetUserId } },
      relations: ['owner'],
    });
  }

async findOne(productId: number, requestingUser: User, targetUserId: number): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id: productId, owner: { id: targetUserId } },
      relations: ['owner'],
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado o no pertenece al usuario especificado.');
    }
    return product;
  }

async update(id: number, dto: UpdateProductDto, requestingUser: User): Promise<Product> {
    // Para actualizar, el usuario objetivo es siempre el mismo que hace la petición.
    const product = await this.findOne(id, requestingUser, requestingUser.id); // <-- LLAMADA CORREGIDA

    if (dto.price && dto.price !== product.currentPrice) {
      await this.priceHistoryRepo.save({
        product,
        price: dto.price,
      });
      product.currentPrice = dto.price;
    }

    const { price, ...otherDtoProps } = dto;
    Object.assign(product, otherDtoProps);

    await this.productRepo.save(product);
    return this.findOne(id, requestingUser, requestingUser.id); // Re-fetch para devolver el estado actualizado
  }
  

 async remove(id: number, requestingUser: User): Promise<Product> {
    // Para eliminar, el usuario objetivo es siempre el mismo que hace la petición.
    const product = await this.findOne(id, requestingUser, requestingUser.id); // <-- LLAMADA CORREGIDA
    return this.productRepo.remove(product);
  }

  async toggleStatus(id: number, requestingUser: User): Promise<Product> {
    // Para cambiar el estado, el usuario objetivo es siempre el mismo que hace la petición.
    const product = await this.findOne(id, requestingUser, requestingUser.id); // <-- LLAMADA CORREGIDA

    product.status = product.status === 'activo' ? 'inactivo' : 'activo';

    const savedProduct = await this.productRepo.save(product);
    return this.findOne(savedProduct.id, requestingUser, requestingUser.id); // Re-fetch para devolver el estado actualizado
  }

  
}