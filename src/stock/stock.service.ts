import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockMovement } from './entities/stock-movement.entity';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { Product } from '../product/entities/product.entity';
import { User } from '../user/entities/user.entity';
import { StockSummaryResponseDto } from './dto/stock-summary-response.dto';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(StockMovement)
    private readonly stockRepo: Repository<StockMovement>,

    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async create(dto: CreateStockMovementDto, user: User) {
    const product = await this.productRepo.findOne({ where: { id: dto.productId, owner: { id: user.id } } });
    if (!product) throw new NotFoundException('Producto no encontrado');

    const movement = this.stockRepo.create({
      ...dto,
      product,
      user,
      productNameAtTime: product.name, // Guardar el nombre del producto al momento del movimiento
      date: new Date(), // Establecer fecha actual si no se proporciona
    });

    return this.stockRepo.save(movement);
  }

  async getByProduct(productId: number, userId: number) {
    return this.stockRepo.find({
      where: { product: { id: productId, owner: { id: userId } } },
      order: { createdAt: 'DESC' },
    });
  }

 async getSummary(productId: number, userId: number): Promise<StockSummaryResponseDto> { // Return StockSummaryResponseDto
    const product = await this.productRepo.findOne({
      where: { id: productId, owner: { id: userId } },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado para el resumen de stock');
    }

    const movements = await this.getByProduct(productId, userId);
    const total = movements.reduce((sum, m) => {
      switch (m.type) {
        case 'in':
          return sum + m.quantity;
        case 'out':
        case 'usage':
          return sum - m.quantity;
        case 'adjustment':
          // Los ajustes pueden ser positivos (agregar) o negativos (quitar)
          // Si quantity es positiva = ajuste hacia arriba
          // Si quantity es negativa = ajuste hacia abajo
          return sum + m.quantity;
        default:
          return sum;
      }
    }, 0);

    return {
      productId: product.id,
      productName: product.name,
      productDescription: product.description,
      productCurrentPrice: product.currentPrice,
      productStatus: product.status,
      availableStock: total,
    };
  }

}
