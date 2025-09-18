import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Product } from '../product/entities/product.entity';
import { StockMovement } from '../stock/entities/stock-movement.entity';
import { ProductDimensions } from './entities/product-dimensions.entity';
import { ProductPackaging } from './entities/product-packaging.entity';
import { ProductInventoryConfig } from './entities/product-inventory-config.entity';
import { InventoryDashboardMetricsDto, TrendDto } from './dto/inventory-dashboard-metrics.dto';
import { LowStockProductDto, LowStockProductsDto } from './dto/low-stock-products.dto';
import { StockDistributionDto } from './dto/stock-distribution.dto';
import { MovementsChartDto } from './dto/movements-chart.dto';
import { RecentMovementsDto } from './dto/recent-movements.dto';
import { UpdateProductDimensionsDto, ProductDimensionsDto } from './dto/product-dimensions.dto';
import { UpdateProductPackagingDto, ProductPackagingDto } from './dto/product-packaging.dto';
import { UpdateProductInventoryConfigDto, ProductInventoryConfigDto } from './dto/product-inventory-config.dto';
import { ExtendedProductResponseDto, StockLevel } from './dto/extended-product-response.dto';
import { 
  InventoryDashboardAdvancedMetricsDto, 
  AdvancedLowStockProductDto,
  TopMoversDto, 
  StockValueHistoryDto, 
  MovementAnalysisDto,
  UserMovementStatsDto,
  DailyActivityDto
} from './dto/inventory-dashboard-advanced-metrics.dto';
import { plainToInstance } from 'class-transformer';
import { StockMovementResponseDto } from '../stock/dto/stock-movement-response.dto';
import { startOfDay, endOfDay, subDays, format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(StockMovement)
    private readonly stockMovementRepository: Repository<StockMovement>,
    @InjectRepository(ProductDimensions)
    private readonly dimensionsRepository: Repository<ProductDimensions>,
    @InjectRepository(ProductPackaging)
    private readonly packagingRepository: Repository<ProductPackaging>,
    @InjectRepository(ProductInventoryConfig)
    private readonly inventoryConfigRepository: Repository<ProductInventoryConfig>,
  ) {}

  async getDashboardMetrics(): Promise<InventoryDashboardMetricsDto> {
    // Obtener productos con stock
    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoin('product.inventoryConfig', 'config')
      .select([
        'product.id',
        'product.name',
        'product.currentPrice',
        'config.currentStock',
        'config.minStockLevel'
      ])
      .getMany();

    const totalProducts = products.length;
    let lowStockProducts = 0;
    let outOfStockProducts = 0;
    let overStockProducts = 0;
    let totalInventoryValue = 0;

    products.forEach(product => {
      const currentStock = product.inventoryConfig?.currentStock || 0;
      const minStock = product.inventoryConfig?.minStockLevel || 0;
      const price = product.currentPrice || 0;

      totalInventoryValue += currentStock * price;

      if (currentStock === 0) {
        outOfStockProducts++;
      } else if (currentStock <= minStock * 1.2) {
        lowStockProducts++;
      } else if (minStock > 0 && currentStock > minStock * 3) {
        overStockProducts++;
      }
    });

    // Movimientos de hoy
    const today = new Date();
    const movementsToday = await this.stockMovementRepository
      .createQueryBuilder('movement')
      .where('movement.createdAt >= :startOfDay', { startOfDay: startOfDay(today) })
      .andWhere('movement.createdAt <= :endOfDay', { endOfDay: endOfDay(today) })
      .getCount();

    // Calcular tendencias comparando con el mes anterior
    const trends = await this.calculateTrends();

    return {
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      overStockProducts,
      totalInventoryValue,
      movementsToday,
      trends
    };
  }

  private async calculateTrends() {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const sixtyDaysAgo = subDays(now, 60);

    // Productos actuales vs hace 30 días
    const currentProducts = await this.productRepository.count();
    const productsThirtyDaysAgo = await this.productRepository
      .createQueryBuilder('product')
      .where('product.createdAt <= :date', { date: thirtyDaysAgo })
      .getCount();

    const productsTrend = this.calculateTrendPercentage(currentProducts, productsThirtyDaysAgo);

    // Movimientos últimos 30 días vs 30 días anteriores
    const recentMovements = await this.stockMovementRepository
      .createQueryBuilder('movement')
      .where('movement.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .andWhere('movement.createdAt <= :now', { now })
      .getCount();

    const olderMovements = await this.stockMovementRepository
      .createQueryBuilder('movement')
      .where('movement.createdAt >= :sixtyDaysAgo', { sixtyDaysAgo })
      .andWhere('movement.createdAt <= :thirtyDaysAgo', { thirtyDaysAgo })
      .getCount();

    const movementsTrend = this.calculateTrendPercentage(recentMovements, olderMovements);

    return {
      products: { trend: productsTrend, label: this.getTrendLabel(productsTrend) },
      lowStock: { trend: 0, label: 'Sin cambios' }, // Simplificado
      value: { trend: 0, label: 'Sin cambios' }, // Simplificado
      movements: { trend: movementsTrend, label: this.getTrendLabel(movementsTrend) }
    };
  }

  private calculateTrendPercentage(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  private getTrendLabel(trend: number): string {
    if (trend > 10) return 'Aumento significativo';
    if (trend > 0) return 'Ligero aumento';
    if (trend < -10) return 'Disminución significativa';
    if (trend < 0) return 'Ligera disminución';
    return 'Sin cambios';
  }

  async getRecentMovements(limit: number = 10): Promise<RecentMovementsDto> {
    const movements = await this.stockMovementRepository.find({
      relations: ['product'],
      order: { createdAt: 'DESC' },
      take: limit
    });

    const movementDtos = movements.map(movement => ({
      id: movement.id,
      productId: movement.product.id,
      productName: movement.product.name,
      productNameAtTime: movement.productNameAtTime,
      type: movement.type,
      quantity: movement.quantity,
      reason: movement.reason,
      createdAt: movement.createdAt.toISOString()
    }));

    return { movements: movementDtos as StockMovementResponseDto[] };
  }

  async getLowStockProducts(limit: number = 10): Promise<LowStockProductsDto> {
    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoin('product.inventoryConfig', 'config')
      .where('config.currentStock <= config.minStockLevel * 1.2')
      .orWhere('config.currentStock = 0')
      .orderBy('(config.currentStock / NULLIF(config.minStockLevel, 0))', 'ASC')
      .limit(limit)
      .getMany();

    const lowStockProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      currentStock: product.inventoryConfig?.currentStock || 0,
      minStock: product.inventoryConfig?.minStockLevel || 0,
      status: (product.inventoryConfig?.currentStock || 0) === 0 ? 'danger' as const : 'warning' as const
    }));

    return { products: lowStockProducts };
  }

  async getStockDistribution(): Promise<StockDistributionDto> {
    const products = await this.productRepository.find({
      relations: ['inventoryConfig']
    });

    let normal = 0;
    let low = 0;
    let empty = 0;
    let over = 0;

    products.forEach(product => {
      const currentStock = product.inventoryConfig?.currentStock || 0;
      const minStock = product.inventoryConfig?.minStockLevel || 0;

      if (currentStock === 0) {
        empty++;
      } else if (currentStock <= minStock * 1.2) {
        low++;
      } else if (minStock > 0 && currentStock > minStock * 3) {
        over++;
      } else {
        normal++;
      }
    });

    return { normal, low, empty, over };
  }

  async getMovementsChart(period: string = '7d'): Promise<MovementsChartDto> {
    const days = period === '7d' ? 7 : 30;
    const endDate = new Date();
    const startDate = subDays(endDate, days - 1);

    const daysArray = eachDayOfInterval({ start: startDate, end: endDate });
    
    const labels = daysArray.map(day => 
      format(day, 'EEE', { locale: es }).substring(0, 3)
    );

    const entriesData: number[] = [];
    const exitsData: number[] = [];

    for (const day of daysArray) {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);

      const entries = await this.stockMovementRepository
        .createQueryBuilder('movement')
        .where('movement.type = :type', { type: 'in' })
        .andWhere('movement.createdAt >= :dayStart', { dayStart })
        .andWhere('movement.createdAt <= :dayEnd', { dayEnd })
        .getCount();

      const exits = await this.stockMovementRepository
        .createQueryBuilder('movement')
        .where('movement.type = :type', { type: 'out' })
        .andWhere('movement.createdAt >= :dayStart', { dayStart })
        .andWhere('movement.createdAt <= :dayEnd', { dayEnd })
        .getCount();

      entriesData.push(entries);
      exitsData.push(exits);
    }

    return {
      labels,
      entriesData,
      exitsData
    };
  }

  // Extended Product Management Methods

  async updateProductDimensions(productId: number, updateDto: UpdateProductDimensionsDto): Promise<ProductDimensionsDto> {
    // Verificar que el producto existe
    const product = await this.productRepository.findOne({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException(`Producto con ID ${productId} no encontrado`);
    }

    let dimensions = await this.dimensionsRepository.findOne({ where: { productId } });
    
    if (!dimensions) {
      dimensions = this.dimensionsRepository.create({
        productId,
        ...updateDto
      });
    } else {
      Object.assign(dimensions, updateDto);
    }

    const savedDimensions = await this.dimensionsRepository.save(dimensions);
    return plainToInstance(ProductDimensionsDto, savedDimensions);
  }

  async getProductDimensions(productId: number): Promise<ProductDimensionsDto> {
    const dimensions = await this.dimensionsRepository.findOne({ where: { productId } });
    if (!dimensions) {
      throw new NotFoundException(`Dimensiones para producto ID ${productId} no encontradas`);
    }
    return plainToInstance(ProductDimensionsDto, dimensions);
  }

  async updateProductPackaging(productId: number, updateDto: UpdateProductPackagingDto): Promise<ProductPackagingDto> {
    const product = await this.productRepository.findOne({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException(`Producto con ID ${productId} no encontrado`);
    }

    let packaging = await this.packagingRepository.findOne({ where: { productId } });
    
    if (!packaging) {
      packaging = this.packagingRepository.create({
        productId,
        ...updateDto
      });
    } else {
      Object.assign(packaging, updateDto);
    }

    const savedPackaging = await this.packagingRepository.save(packaging);
    return plainToInstance(ProductPackagingDto, savedPackaging);
  }

  async getProductPackaging(productId: number): Promise<ProductPackagingDto> {
    const packaging = await this.packagingRepository.findOne({ where: { productId } });
    if (!packaging) {
      throw new NotFoundException(`Información de empaquetado para producto ID ${productId} no encontrada`);
    }
    return plainToInstance(ProductPackagingDto, packaging);
  }

  async updateInventoryConfig(productId: number, updateDto: UpdateProductInventoryConfigDto): Promise<ProductInventoryConfigDto> {
    const product = await this.productRepository.findOne({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException(`Producto con ID ${productId} no encontrado`);
    }

    let config = await this.inventoryConfigRepository.findOne({ where: { productId } });
    
    if (!config) {
      config = this.inventoryConfigRepository.create({
        productId,
        ...updateDto
      });
    } else {
      Object.assign(config, updateDto);
    }

    const savedConfig = await this.inventoryConfigRepository.save(config);
    return plainToInstance(ProductInventoryConfigDto, savedConfig);
  }

  async getInventoryConfig(productId: number): Promise<ProductInventoryConfigDto> {
    const config = await this.inventoryConfigRepository.findOne({ where: { productId } });
    if (!config) {
      throw new NotFoundException(`Configuración de inventario para producto ID ${productId} no encontrada`);
    }
    return plainToInstance(ProductInventoryConfigDto, config);
  }

  async searchProducts(searchParams: {
    query?: string;
    stockLevel?: string;
    category?: string;
    limit?: number;
  }): Promise<ExtendedProductResponseDto[]> {
    const { query, stockLevel, category, limit = 20 } = searchParams;
    
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.dimensions', 'dimensions')
      .leftJoinAndSelect('product.packaging', 'packaging')
      .leftJoinAndSelect('product.inventoryConfig', 'config');

    if (query) {
      queryBuilder.andWhere(
        '(product.name LIKE :query OR product.description LIKE :query)',
        { query: `%${query}%` }
      );
    }

    if (category) {
      queryBuilder.andWhere('product.category = :category', { category });
    }

    if (stockLevel) {
      switch (stockLevel) {
        case 'out':
          queryBuilder.andWhere('config.currentStock = 0');
          break;
        case 'low':
          queryBuilder.andWhere('config.currentStock > 0 AND config.currentStock <= config.minStockLevel * 1.2');
          break;
        case 'medium':
          queryBuilder.andWhere('config.currentStock > config.minStockLevel * 1.2 AND config.currentStock <= config.minStockLevel * 3');
          break;
        case 'high':
          queryBuilder.andWhere('config.currentStock > config.minStockLevel * 3');
          break;
      }
    }

    queryBuilder
      .orderBy('product.name', 'ASC')
      .limit(limit);

    const products = await queryBuilder.getMany();

    return products.map(product => this.mapToExtendedProductResponse(product));
  }

  private mapToExtendedProductResponse(product: any): ExtendedProductResponseDto {
    const currentStock = product.inventoryConfig?.currentStock || 0;
    const minStock = product.inventoryConfig?.minStockLevel || 0;
    const price = product.currentPrice || 0;

    // Determinar nivel de stock
    let stockLevel: StockLevel;
    if (currentStock === 0) {
      stockLevel = StockLevel.OUT;
    } else if (currentStock <= minStock * 1.2) {
      stockLevel = StockLevel.LOW;
    } else if (currentStock <= minStock * 3) {
      stockLevel = StockLevel.MEDIUM;
    } else {
      stockLevel = StockLevel.HIGH;
    }

    // Calcular días hasta agotamiento (simplificado)
    const daysUntilStockout = currentStock > 0 && minStock > 0 
      ? Math.floor(currentStock / (minStock / 30)) 
      : undefined;

    // Calcular cantidad sugerida para reorden
    const suggestedReorderQuantity = minStock > 0 
      ? Math.max(minStock * 2 - currentStock, 0) 
      : undefined;

    return {
      ...product,
      stockLevel,
      daysUntilStockout,
      availableStock: Math.max(currentStock - (product.inventoryConfig?.reservedStock || 0), 0),
      suggestedReorderQuantity,
      stockValue: currentStock * price,
      turnoverRate: 0, // Esto requeriría cálculos más complejos
      dimensions: product.dimensions ? plainToInstance(ProductDimensionsDto, product.dimensions) : undefined,
      packaging: product.packaging ? plainToInstance(ProductPackagingDto, product.packaging) : undefined,
      inventoryConfig: product.inventoryConfig ? plainToInstance(ProductInventoryConfigDto, product.inventoryConfig) : undefined,
    };
  }

  // Advanced Dashboard Methods - Phase 2

  async getAdvancedDashboardMetrics(): Promise<InventoryDashboardAdvancedMetricsDto> {
    const products = await this.productRepository.find({
      relations: ['inventoryConfig']
    });

    const totalProducts = products.length;
    const totalActiveProducts = products.length; // Simplificado: todos los productos son activos
    
    let totalInventoryValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let criticalItemsCount = 0;

    products.forEach(product => {
      const currentStock = product.inventoryConfig?.currentStock || 0;
      const minStock = product.inventoryConfig?.minStockLevel || 0;
      const price = product.currentPrice || 0;

      totalInventoryValue += currentStock * price;

      if (currentStock === 0) {
        outOfStockCount++;
        criticalItemsCount++;
      } else if (currentStock <= minStock * 1.2) {
        lowStockCount++;
        if (currentStock <= minStock * 0.5) {
          criticalItemsCount++;
        }
      }
    });

    const averageProductValue = totalProducts > 0 ? totalInventoryValue / totalProducts : 0;

    // Movimientos del último mes
    const oneMonthAgo = subDays(new Date(), 30);
    const lastMonthMovements = await this.stockMovementRepository
      .createQueryBuilder('movement')
      .where('movement.createdAt >= :oneMonthAgo', { oneMonthAgo })
      .getCount();

    // Valor total de movimientos del último mes
    const movementsWithValue = await this.stockMovementRepository
      .createQueryBuilder('movement')
      .leftJoin('movement.product', 'product')
      .select([
        'movement.quantity',
        'product.currentPrice'
      ])
      .where('movement.createdAt >= :oneMonthAgo', { oneMonthAgo })
      .getMany();

    const totalMovementValue = movementsWithValue.reduce((acc, movement) => {
      return acc + (Math.abs(movement.quantity) * (movement.product?.currentPrice || 0));
    }, 0);

    // Tasa de rotación simple (movimientos/stock promedio)
    const inventoryTurnoverRate = totalInventoryValue > 0 
      ? (totalMovementValue / totalInventoryValue) * 12 // Anualizada
      : 0;

    return {
      totalProducts,
      totalInventoryValue,
      totalActiveProducts,
      lowStockCount,
      outOfStockCount,
      averageProductValue,
      lastMonthMovements,
      inventoryTurnoverRate,
      totalMovementValue,
      criticalItemsCount,
    };
  }

  async getAdvancedLowStockProducts(limit: number = 20): Promise<AdvancedLowStockProductDto[]> {
    const thirtyDaysAgo = subDays(new Date(), 30);
    
    // Obtener productos con stock bajo junto con información de movimientos
    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoin('product.inventoryConfig', 'config')
      .leftJoin(
        'stock_movement',
        'movement',
        'movement.productId = product.id AND movement.createdAt >= :thirtyDaysAgo'
      )
      .select([
        'product.id',
        'product.name',
        'config.currentStock',
        'config.minStockLevel',
        'product.currentPrice',
        'MAX(movement.createdAt) as lastMovementDate',
        'COUNT(movement.id) as movementCount',
        'ABS(SUM(CASE WHEN movement.type = "out" THEN movement.quantity ELSE 0 END)) as totalOutMovements'
      ])
      .where('config.currentStock <= config.minStockLevel * 1.2 OR config.currentStock = 0')
      .groupBy('product.id')
      .orderBy('(config.currentStock / NULLIF(config.minStockLevel, 0))', 'ASC')
      .limit(limit)
      .setParameter('thirtyDaysAgo', thirtyDaysAgo)
      .getRawMany();

    return products.map(product => {
      const currentStock = product.config_currentStock || 0;
      const minStock = product.config_minStockLevel || 0;
      const movementCount = parseInt(product.movementCount) || 0;
      const totalOutMovements = parseInt(product.totalOutMovements) || 0;
      
      // Cálculos
      const reorderPoint = Math.max(minStock * 1.5, 1);
      const averageConsumptionRate = movementCount > 0 ? totalOutMovements / 30 : 0;
      const daysUntilStockout = averageConsumptionRate > 0 
        ? Math.floor(currentStock / averageConsumptionRate) 
        : 999;
      const suggestedReorderQuantity = Math.max(reorderPoint * 2 - currentStock, 0);

      return {
        productId: product.product_id,
        productName: product.product_name,
        currentStock,
        minStockLevel: minStock,
        reorderPoint,
        daysUntilStockout,
        suggestedReorderQuantity,
        lastMovementDate: product.lastMovementDate ? new Date(product.lastMovementDate) : new Date(),
        averageConsumptionRate,
      };
    });
  }

  async getTopMovers(limit: number = 10, days: number = 30): Promise<TopMoversDto[]> {
    const startDate = subDays(new Date(), days);
    
    const topMovers = await this.stockMovementRepository
      .createQueryBuilder('movement')
      .leftJoin('movement.product', 'product')
      .select([
        'product.id as productId',
        'product.name as productName',
        'product.currentPrice as currentPrice',
        'COUNT(movement.id) as totalMovements',
        'SUM(CASE WHEN movement.type = "in" THEN 1 ELSE 0 END) as inMovements',
        'SUM(CASE WHEN movement.type = "out" THEN 1 ELSE 0 END) as outMovements',
        'SUM(CASE WHEN movement.type = "adjustment" THEN 1 ELSE 0 END) as adjustmentMovements',
        'SUM(CASE WHEN movement.type = "usage" THEN 1 ELSE 0 END) as usageMovements',
        'ABS(SUM(movement.quantity)) as totalQuantityMoved'
      ])
      .where('movement.createdAt >= :startDate', { startDate })
      .groupBy('product.id')
      .orderBy('totalMovements', 'DESC')
      .limit(limit)
      .getRawMany();

    return topMovers.map(mover => {
      const totalMovements = parseInt(mover.totalMovements);
      const currentPrice = parseFloat(mover.currentPrice) || 0;
      const totalQuantityMoved = parseFloat(mover.totalQuantityMoved) || 0;
      const movementValue = totalQuantityMoved * currentPrice;
      
      // Calcular tendencia simplificada
      const inMovements = parseInt(mover.inMovements);
      const outMovements = parseInt(mover.outMovements);
      let trend: 'up' | 'down' | 'stable' = 'stable';
      
      if (inMovements > outMovements * 1.2) {
        trend = 'up';
      } else if (outMovements > inMovements * 1.2) {
        trend = 'down';
      }

      return {
        productId: mover.productId,
        productName: mover.productName,
        totalMovements,
        inMovements,
        outMovements,
        adjustmentMovements: parseInt(mover.adjustmentMovements),
        usageMovements: parseInt(mover.usageMovements),
        movementValue,
        turnoverRate: 0, // Simplificado para esta implementación
        trend,
      };
    });
  }

  async getStockValueHistory(months: number = 12): Promise<StockValueHistoryDto[]> {
    const history: StockValueHistoryDto[] = [];
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const period = format(date, 'yyyy-MM');
      
      // Para simplificar, usaremos valores simulados basados en el valor actual
      // En una implementación completa, necesitarías un snapshot histórico
      const currentMetrics = await this.getAdvancedDashboardMetrics();
      
      const variation = Math.random() * 0.2 - 0.1; // ±10% de variación
      const totalValue = currentMetrics.totalInventoryValue * (1 + variation);
      const productCount = Math.floor(currentMetrics.totalProducts * (1 + variation * 0.5));
      const averageValue = productCount > 0 ? totalValue / productCount : 0;
      
      const previousValue = history.length > 0 ? history[history.length - 1].totalValue : totalValue;
      const monthOverMonthGrowth = previousValue > 0 
        ? ((totalValue - previousValue) / previousValue) * 100 
        : 0;

      history.push({
        period,
        totalValue,
        productCount,
        averageValue,
        monthOverMonthGrowth,
      });
    }
    
    return history;
  }

  async getMovementAnalysis(days: number = 30): Promise<MovementAnalysisDto> {
    const startDate = subDays(new Date(), days);
    
    // Análisis de movimientos por tipo
    const movementsByType = await this.stockMovementRepository
      .createQueryBuilder('movement')
      .select([
        'movement.type',
        'COUNT(movement.id) as count',
        'ABS(SUM(movement.quantity)) as totalQuantity'
      ])
      .where('movement.createdAt >= :startDate', { startDate })
      .groupBy('movement.type')
      .getRawMany();

    const totalMovements = movementsByType.reduce((acc, item) => acc + parseInt(item.count), 0);
    
    const movementTypes = {
      in: 0,
      out: 0,
      adjustment: 0,
      usage: 0,
    };
    
    movementsByType.forEach(item => {
      if (item.movement_type in movementTypes) {
        movementTypes[item.movement_type] = parseInt(item.count);
      }
    });

    // Top usuarios con más actividad
    const topUsers = await this.stockMovementRepository
      .createQueryBuilder('movement')
      .leftJoin('movement.createdBy', 'user')
      .select([
        'user.id as userId',
        'user.name as userName',
        'COUNT(movement.id) as totalMovements',
        'MAX(movement.createdAt) as lastActivity'
      ])
      .where('movement.createdAt >= :startDate', { startDate })
      .groupBy('user.id')
      .orderBy('totalMovements', 'DESC')
      .limit(5)
      .getRawMany();

    // Actividad diaria
    const dailyActivity = await this.stockMovementRepository
      .createQueryBuilder('movement')
      .leftJoin('movement.product', 'product')
      .select([
        'DATE(movement.createdAt) as date',
        'COUNT(movement.id) as totalMovements',
        'SUM(ABS(movement.quantity) * COALESCE(product.currentPrice, 0)) as totalValue'
      ])
      .where('movement.createdAt >= :startDate', { startDate })
      .groupBy('DATE(movement.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    const averageMovementValue = dailyActivity.reduce((acc, day) => 
      acc + parseFloat(day.totalValue), 0) / Math.max(dailyActivity.length, 1);

    return {
      totalMovements,
      movementsByType: movementTypes,
      topUsers: topUsers.map(user => ({
        userId: user.userId,
        userName: user.userName,
        totalMovements: parseInt(user.totalMovements),
        lastActivity: new Date(user.lastActivity),
      })),
      dailyActivity: dailyActivity.map(day => ({
        date: day.date,
        totalMovements: parseInt(day.totalMovements),
        totalValue: parseFloat(day.totalValue) || 0,
      })),
      averageMovementValue,
    };
  }
}