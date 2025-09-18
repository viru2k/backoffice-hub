import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { ServiceService } from './service.service';
import { ProductService } from '../product/product.service';
import { ItemSelectorResponseDto } from './dto/item-selector-response.dto';
import { ServiceStatus } from './entities/service.entity';

@ApiTags('service-items')
@Controller('service-items')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ServiceItemsController {
  constructor(
    private readonly serviceService: ServiceService,
    private readonly productService: ProductService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get combined products and services for invoice selector' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by type', enum: ['product', 'service'] })
  @ApiResponse({ status: 200, type: [ItemSelectorResponseDto] })
  async getItems(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('type') type?: 'product' | 'service',
    @Request() req?: any,
  ): Promise<ItemSelectorResponseDto[]> {
    const items: ItemSelectorResponseDto[] = [];

    // Get services if not filtered to products only
    if (!type || type === 'service') {
      const servicesResponse = await this.serviceService.findAll(
        { search, category, status: ServiceStatus.ACTIVE },
        req.user,
      );

      items.push(
        ...servicesResponse.services.map(service => ({
          id: service.id,
          type: 'service' as const,
          name: service.name,
          description: service.description,
          category: service.category,
          price: service.basePrice,
          duration: service.duration,
          status: service.status,
          thumbnailUrl: service.thumbnailUrl,
        })),
      );
    }

    // Get products if not filtered to services only
    if (!type || type === 'product') {
      const products = await this.productService.findAll(req.user, req.user.id);

      // Filter products by search criteria
      const filteredProducts = products.filter(product => {
        if (search && !product.name.toLowerCase().includes(search.toLowerCase())) {
          return false;
        }
        return product.status === 'activo';
      });

      items.push(
        ...filteredProducts.map(product => ({
          id: product.id,
          type: 'product' as const,
          name: product.name,
          description: product.description,
          category: undefined, // Products don't have categories in current schema
          price: product.currentPrice,
          duration: undefined,
          status: product.status,
          thumbnailUrl: undefined, // Products don't have thumbnailUrl
        })),
      );
    }

    // Sort by name
    return items.sort((a, b) => a.name.localeCompare(b.name));
  }
}