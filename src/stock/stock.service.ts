import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockMovement } from './entities/stock-movement.entity';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { Product } from 'src/product/entities/product.entity';
import { User } from 'src/user/entities/user.entity';

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
    });

    return this.stockRepo.save(movement);
  }

  async getByProduct(productId: number, userId: number) {
    return this.stockRepo.find({
      where: { product: { id: productId, owner: { id: userId } } },
      order: { createdAt: 'DESC' },
    });
  }

  async getSummary(productId: number, userId: number) {
    const movements = await this.getByProduct(productId, userId);
    const total = movements.reduce((sum, m) => {
      if (m.type === 'in') return sum + m.quantity;
      if (m.type === 'out' || m.type === 'usage') return sum - m.quantity;
      return sum; // 'adjustment' podría no cambiar stock si se registra sin efecto
    }, 0);

    return { productId, available: total };
  }
}
