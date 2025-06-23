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
  Query,
  ForbiddenException,
  ParseIntPipe
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ProductResponseDto } from './dto/product-response.dto';
import { Product } from './entities/product.entity'; // Importa la entidad Product
import { UserService } from 'src/user/user.service';

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

function mapProductToDto(product: Product): ProductResponseDto {
  if (!product) return null;
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    status: product.status,
    currentPrice: product.currentPrice,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    owner: {
      id: product.owner.id,
      fullName: product.owner.fullName,
    },
  };
}

@ApiTags('products') // Etiqueta para Swagger
@ApiBearerAuth() // Indica que se requiere autenticación Bearer (JWT)
@UseGuards(AuthGuard('jwt')) // Protege todas las rutas de este controlador con el AuthGuard de JWT
@Controller('products') // Define la ruta base para este controlador
export class ProductController {
  constructor(private readonly productService: ProductService, private readonly userService: UserService) {}

  @Post() // Define una ruta POST para crear un producto
  @ApiOperation({ summary: 'Crear un nuevo producto' }) // Descripción para Swagger
  @ApiResponse({ status: 201, description: 'El producto ha sido creado exitosamente.', type: ProductResponseDto })
  async create(@Body() dto: CreateProductDto, @Request() req): Promise<ProductResponseDto> {
    // Llama al servicio para crear el producto, req.user contiene el usuario autenticado
    const productEntity = await this.productService.create(dto, req.user);
    // Mapea la entidad Product devuelta a ProductResponseDto para la respuesta
    return mapProductToResponseDto(productEntity);
  }

@Get()
  @ApiOperation({ summary: 'Listar productos (admin puede ver los de un sub-usuario)' })
  @ApiQuery({ name: 'userId', required: false, type: Number, description: 'Admin: ID del usuario cuyos productos se quieren ver' })
  @ApiResponse({ status: 200, type: [ProductResponseDto] })
  async findAll(
    @Request() req,
    @Query('userId') userId?: string,
  ): Promise<ProductResponseDto[]> {
    const requestingUser = req.user;
    // Si no se provee un userId en la query, el objetivo es el propio usuario que hace la petición.
    const targetUserId = userId ? parseInt(userId, 10) : requestingUser.id;

    // Lógica de permisos
    if (targetUserId !== requestingUser.id) {
      if (!requestingUser.isAdmin) {
        throw new ForbiddenException('No tienes permisos para ver los productos de otros usuarios.');
      }
      const isMember = await this.userService.isUserInAdminGroup(targetUserId, requestingUser.id);
      if (!isMember) {
        throw new ForbiddenException('El usuario especificado no pertenece a su grupo.');
      }
    }

    // LLAMADA AL SERVICIO CORREGIDA: se pasan 2 argumentos.
    const products = await this.productService.findAll(requestingUser, targetUserId);
    return products.map(mapProductToDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles de un producto (admin puede ver los de un sub-usuario)' })
  @ApiQuery({ name: 'userId', required: false, type: Number, description: 'Admin: ID del usuario dueño del producto' })
  @ApiResponse({ status: 200, type: ProductResponseDto })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Query('userId') userId?: string,
  ): Promise<ProductResponseDto> {
    const requestingUser = req.user;
    const targetUserId = userId ? parseInt(userId, 10) : requestingUser.id;

    // Lógica de permisos
    if (targetUserId !== requestingUser.id) {
      if (!requestingUser.isAdmin) {
        throw new ForbiddenException('No tienes permisos para ver los productos de otros usuarios.');
      }
      const isMember = await this.userService.isUserInAdminGroup(targetUserId, requestingUser.id);
      if (!isMember) {
        throw new ForbiddenException('El usuario especificado no pertenece a su grupo.');
      }
    }

    // LLAMADA AL SERVICIO CORREGIDA: se pasan 3 argumentos.
    const product = await this.productService.findOne(id, requestingUser, targetUserId);
    return mapProductToDto(product);
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