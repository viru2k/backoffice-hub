import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ProductResponseDto } from './dto/product-response.dto';
import { Product } from './entities/product.entity'; // Importa la entidad Product

// Función auxiliar para mapear la entidad Product a ProductResponseDto
function mapProductToResponseDto(product: Product): ProductResponseDto {
  if (!product) return null;
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    status: product.status,
    currentPrice: product.currentPrice,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    owner: product.owner ? { // Verifica si owner existe
      id: product.owner.id,
      fullName: product.owner.fullName,
    } : null,
  };
}

@ApiTags('products') // Etiqueta para Swagger
@ApiBearerAuth() // Indica que se requiere autenticación Bearer (JWT)
@UseGuards(AuthGuard('jwt')) // Protege todas las rutas de este controlador con el AuthGuard de JWT
@Controller('products') // Define la ruta base para este controlador
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post() // Define una ruta POST para crear un producto
  @ApiOperation({ summary: 'Crear un nuevo producto' }) // Descripción para Swagger
  @ApiResponse({ status: 201, description: 'El producto ha sido creado exitosamente.', type: ProductResponseDto })
  async create(@Body() dto: CreateProductDto, @Request() req): Promise<ProductResponseDto> {
    // Llama al servicio para crear el producto, req.user contiene el usuario autenticado
    const productEntity = await this.productService.create(dto, req.user);
    // Mapea la entidad Product devuelta a ProductResponseDto para la respuesta
    return mapProductToResponseDto(productEntity);
  }

  @Get() // Define una ruta GET para listar productos
  @ApiOperation({ summary: 'Listar productos del usuario' })
  @ApiResponse({ status: 200, description: 'Lista de productos.', type: [ProductResponseDto] })
  async findAll(@Request() req): Promise<ProductResponseDto[]> {
    // Llama al servicio para obtener todos los productos del usuario autenticado (req.user.id)
    const products = await this.productService.findAll(req.user.id);
    // Mapea cada entidad Product a ProductResponseDto
    return products.map(mapProductToResponseDto);
  }

  @Get(':id') // Define una ruta GET para obtener un producto por su ID
  @ApiOperation({ summary: 'Obtener detalles de un producto' })
  @ApiResponse({ status: 200, description: 'Detalles del producto.', type: ProductResponseDto })
  async findOne(@Param('id') id: number, @Request() req): Promise<ProductResponseDto> {
    // Llama al servicio para obtener un producto específico del usuario autenticado
    const productEntity = await this.productService.findOne(id, req.user.id);
    // Mapea la entidad Product a ProductResponseDto
    return mapProductToResponseDto(productEntity);
  }

  @Patch(':id') // Define una ruta PATCH para actualizar un producto por su ID
  @ApiOperation({ summary: 'Actualizar un producto' })
  @ApiResponse({ status: 200, description: 'El producto ha sido actualizado exitosamente.', type: ProductResponseDto })
  async update(@Param('id') id: number, @Body() dto: UpdateProductDto, @Request() req): Promise<ProductResponseDto> {
    // Llama al servicio para actualizar el producto
    const updatedProduct = await this.productService.update(id, dto, req.user.id);
    // Mapea la entidad Product actualizada a ProductResponseDto
    return mapProductToResponseDto(updatedProduct);
  }

  @Delete(':id') // Define una ruta DELETE para eliminar un producto por su ID
  @ApiOperation({ summary: 'Eliminar un producto' })
  @ApiResponse({ status: 204, description: 'El producto ha sido eliminado exitosamente.' })
  @HttpCode(HttpStatus.NO_CONTENT) // Establece el código de estado HTTP a 204 (Sin Contenido)
  async remove(@Param('id') id: number, @Request() req): Promise<void> { // Devuelve void para respuestas 204
    // Llama al servicio para eliminar el producto
    await this.productService.remove(id, req.user.id);
  }

  @Patch(':id/toggle') // Define una ruta PATCH para cambiar el estado de un producto
  @ApiOperation({ summary: 'Alternar estado activo/inactivo de un producto' })
  @ApiResponse({ status: 200, description: 'El estado del producto ha sido alternado exitosamente.', type: ProductResponseDto })
  async toggle(@Param('id') id: number, @Request() req): Promise<ProductResponseDto> {
    // Llama al servicio para cambiar el estado del producto
    const productEntity = await this.productService.toggleStatus(id, req.user.id);
    // Mapea la entidad Product con el estado actualizado a ProductResponseDto
    return mapProductToResponseDto(productEntity);
  }
}