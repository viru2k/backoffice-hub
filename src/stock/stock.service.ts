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
      if (m.type === 'in') return sum + m.quantity;
      if (m.type === 'out' || m.type === 'usage') return sum - m.quantity;
      // 'adjustment' might not change stock if recorded without net effect,
      // or could be an increase/decrease. Assuming adjustments are net changes.
      // If an adjustment means "set stock to X", this logic needs to be more complex.
      // For now, assuming 'adjustment' can be positive (add) or negative (subtract) if needed,
      // but typically 'in' and 'out' cover those.
      // If 'adjustment' is just setting a new value, this calculation needs to be rethought.
      // For simplicity here, it doesn't modify the sum unless specifically handled.
      return sum;
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
