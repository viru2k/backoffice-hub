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
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('products')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo producto' })
  create(@Body() dto: CreateProductDto, @Request() req) {
    return this.productService.create(dto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Listar productos del usuario' })
  findAll(@Request() req) {
    return this.productService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles de un producto' })
  findOne(@Param('id') id: number, @Request() req) {
    return this.productService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un producto' })
  update(@Param('id') id: number, @Body() dto: UpdateProductDto, @Request() req) {
    return this.productService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un producto' })
  remove(@Param('id') id: number, @Request() req) {
    return this.productService.remove(id, req.user.id);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activar o desactivar un producto' })
  activate(@Param('id') id: number, @Request() req) {
    return this.productService.activate(id, req.user.id);
  }
}
