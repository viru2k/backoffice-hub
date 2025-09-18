import { Controller, Get, Put, Query, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { InventoryDashboardMetricsDto } from './dto/inventory-dashboard-metrics.dto';
import { RecentMovementsDto } from './dto/recent-movements.dto';
import { LowStockProductsDto } from './dto/low-stock-products.dto';
import { StockDistributionDto } from './dto/stock-distribution.dto';
import { MovementsChartDto } from './dto/movements-chart.dto';
import { UpdateProductDimensionsDto, ProductDimensionsDto } from './dto/product-dimensions.dto';
import { UpdateProductPackagingDto, ProductPackagingDto } from './dto/product-packaging.dto';
import { UpdateProductInventoryConfigDto, ProductInventoryConfigDto } from './dto/product-inventory-config.dto';
import { ExtendedProductResponseDto } from './dto/extended-product-response.dto';
import { 
  InventoryDashboardAdvancedMetricsDto, 
  AdvancedLowStockProductDto, 
  TopMoversDto, 
  StockValueHistoryDto, 
  MovementAnalysisDto 
} from './dto/inventory-dashboard-advanced-metrics.dto';

@Controller('inventory')
@ApiTags('Inventory Dashboard')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('dashboard/metrics')
  @ApiOperation({ summary: 'Obtener métricas consolidadas del dashboard de inventario' })
  @ApiResponse({ 
    status: 200, 
    description: 'Métricas consolidadas del inventario',
    type: InventoryDashboardMetricsDto 
  })
  async getDashboardMetrics(): Promise<InventoryDashboardMetricsDto> {
    return this.inventoryService.getDashboardMetrics();
  }

  @Get('movements/recent')
  @ApiOperation({ summary: 'Obtener movimientos recientes de inventario' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de movimientos recientes de inventario',
    type: RecentMovementsDto 
  })
  async getRecentMovements(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number
  ): Promise<RecentMovementsDto> {
    return this.inventoryService.getRecentMovements(limit || 10);
  }

  @Get('products/low-stock')
  @ApiOperation({ summary: 'Obtener productos con stock bajo' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de productos con stock bajo o agotado',
    type: LowStockProductsDto 
  })
  async getLowStockProducts(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number
  ): Promise<LowStockProductsDto> {
    return this.inventoryService.getLowStockProducts(limit || 10);
  }

  @Get('dashboard/stock-distribution')
  @ApiOperation({ summary: 'Obtener distribución del stock para gráficos' })
  @ApiResponse({ 
    status: 200, 
    description: 'Distribución de productos por estado de stock',
    type: StockDistributionDto 
  })
  async getStockDistribution(): Promise<StockDistributionDto> {
    return this.inventoryService.getStockDistribution();
  }

  @Get('dashboard/movements-chart')
  @ApiOperation({ summary: 'Obtener datos de movimientos para gráfico semanal' })
  @ApiQuery({ name: 'period', required: false, enum: ['7d', '30d'], example: '7d' })
  @ApiResponse({ 
    status: 200, 
    description: 'Datos de movimientos de inventario para gráficos',
    type: MovementsChartDto 
  })
  async getMovementsChart(
    @Query('period') period?: string
  ): Promise<MovementsChartDto> {
    return this.inventoryService.getMovementsChart(period || '7d');
  }

  // Extended Product Management Endpoints

  @Put('products/:id/dimensions')
  @ApiOperation({ summary: 'Actualizar dimensiones del producto' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID del producto' })
  @ApiResponse({ 
    status: 200, 
    description: 'Dimensiones del producto actualizadas',
    type: ProductDimensionsDto 
  })
  async updateProductDimensions(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateProductDimensionsDto
  ): Promise<ProductDimensionsDto> {
    return this.inventoryService.updateProductDimensions(id, updateDto);
  }

  @Get('products/:id/dimensions')
  @ApiOperation({ summary: 'Obtener dimensiones del producto' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID del producto' })
  @ApiResponse({ 
    status: 200, 
    description: 'Dimensiones del producto',
    type: ProductDimensionsDto 
  })
  async getProductDimensions(
    @Param('id', ParseIntPipe) id: number
  ): Promise<ProductDimensionsDto> {
    return this.inventoryService.getProductDimensions(id);
  }

  @Put('products/:id/packaging')
  @ApiOperation({ summary: 'Actualizar información de empaquetado' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID del producto' })
  @ApiResponse({ 
    status: 200, 
    description: 'Información de empaquetado actualizada',
    type: ProductPackagingDto 
  })
  async updateProductPackaging(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateProductPackagingDto
  ): Promise<ProductPackagingDto> {
    return this.inventoryService.updateProductPackaging(id, updateDto);
  }

  @Get('products/:id/packaging')
  @ApiOperation({ summary: 'Obtener información de empaquetado' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID del producto' })
  @ApiResponse({ 
    status: 200, 
    description: 'Información de empaquetado',
    type: ProductPackagingDto 
  })
  async getProductPackaging(
    @Param('id', ParseIntPipe) id: number
  ): Promise<ProductPackagingDto> {
    return this.inventoryService.getProductPackaging(id);
  }

  @Put('products/:id/inventory-config')
  @ApiOperation({ summary: 'Configurar parámetros de inventario' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID del producto' })
  @ApiResponse({ 
    status: 200, 
    description: 'Configuración de inventario actualizada',
    type: ProductInventoryConfigDto 
  })
  async updateInventoryConfig(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateProductInventoryConfigDto
  ): Promise<ProductInventoryConfigDto> {
    return this.inventoryService.updateInventoryConfig(id, updateDto);
  }

  @Get('products/:id/inventory-config')
  @ApiOperation({ summary: 'Obtener configuración de inventario' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID del producto' })
  @ApiResponse({ 
    status: 200, 
    description: 'Configuración de inventario',
    type: ProductInventoryConfigDto 
  })
  async getInventoryConfig(
    @Param('id', ParseIntPipe) id: number
  ): Promise<ProductInventoryConfigDto> {
    return this.inventoryService.getInventoryConfig(id);
  }

  @Get('products/search')
  @ApiOperation({ summary: 'Búsqueda avanzada de productos con información extendida' })
  @ApiQuery({ name: 'q', required: false, type: String, description: 'Término de búsqueda' })
  @ApiQuery({ name: 'stockLevel', required: false, enum: ['high', 'medium', 'low', 'out'] })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({ 
    status: 200, 
    description: 'Productos encontrados con información extendida',
    type: [ExtendedProductResponseDto] 
  })
  async searchProducts(
    @Query('q') query?: string,
    @Query('stockLevel') stockLevel?: string,
    @Query('category') category?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number
  ): Promise<ExtendedProductResponseDto[]> {
    return this.inventoryService.searchProducts({
      query,
      stockLevel,
      category,
      limit: limit || 20
    });
  }

  // Advanced Dashboard Endpoints - Phase 2

  @Get('dashboard/advanced-metrics')
  @ApiOperation({ summary: 'Obtener métricas avanzadas del dashboard de inventario' })
  @ApiResponse({ 
    status: 200, 
    description: 'Métricas avanzadas de inventario con análisis detallado',
    type: InventoryDashboardAdvancedMetricsDto 
  })
  async getAdvancedDashboardMetrics(): Promise<InventoryDashboardAdvancedMetricsDto> {
    return this.inventoryService.getAdvancedDashboardMetrics();
  }

  @Get('dashboard/low-stock-advanced')
  @ApiOperation({ summary: 'Obtener análisis avanzado de productos con stock bajo' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista detallada de productos con stock bajo con métricas avanzadas',
    type: [AdvancedLowStockProductDto] 
  })
  async getAdvancedLowStockProducts(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number
  ): Promise<AdvancedLowStockProductDto[]> {
    return this.inventoryService.getAdvancedLowStockProducts(limit || 20);
  }

  @Get('dashboard/top-movers')
  @ApiOperation({ summary: 'Obtener productos con más movimientos' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'days', required: false, type: Number, example: 30 })
  @ApiResponse({ 
    status: 200, 
    description: 'Productos con mayor actividad de movimientos',
    type: [TopMoversDto] 
  })
  async getTopMovers(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('days', new ParseIntPipe({ optional: true })) days?: number
  ): Promise<TopMoversDto[]> {
    return this.inventoryService.getTopMovers(limit || 10, days || 30);
  }

  @Get('dashboard/stock-value-history')
  @ApiOperation({ summary: 'Obtener histórico de valor de inventario' })
  @ApiQuery({ name: 'months', required: false, type: Number, example: 12 })
  @ApiResponse({ 
    status: 200, 
    description: 'Histórico de valor de inventario por mes',
    type: [StockValueHistoryDto] 
  })
  async getStockValueHistory(
    @Query('months', new ParseIntPipe({ optional: true })) months?: number
  ): Promise<StockValueHistoryDto[]> {
    return this.inventoryService.getStockValueHistory(months || 12);
  }

  @Get('dashboard/movement-analysis')
  @ApiOperation({ summary: 'Obtener análisis detallado de movimientos de inventario' })
  @ApiQuery({ name: 'days', required: false, type: Number, example: 30 })
  @ApiResponse({ 
    status: 200, 
    description: 'Análisis completo de movimientos con estadísticas por usuario y actividad diaria',
    type: MovementAnalysisDto 
  })
  async getMovementAnalysis(
    @Query('days', new ParseIntPipe({ optional: true })) days?: number
  ): Promise<MovementAnalysisDto> {
    return this.inventoryService.getMovementAnalysis(days || 30);
  }
}