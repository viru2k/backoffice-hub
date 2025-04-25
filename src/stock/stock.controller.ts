import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Request,
    UseGuards,
  } from '@nestjs/common';
  import { StockService } from './stock.service';
  import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
  import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
  import { AuthGuard } from '@nestjs/passport';
  
  @ApiTags('stock')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Controller('stock')
  export class StockController {
    constructor(private readonly stockService: StockService) {}
  
    @Post()
    @ApiOperation({ summary: 'Registrar movimiento de stock' })
    create(@Body() dto: CreateStockMovementDto, @Request() req) {
      return this.stockService.create(dto, req.user);
    }
  
    @Get(':productId')
    @ApiOperation({ summary: 'Listar movimientos de un producto' })
    getMovements(@Param('productId') id: number, @Request() req) {
      return this.stockService.getByProduct(id, req.user.id);
    }
  
    @Get(':productId/summary')
    @ApiOperation({ summary: 'Resumen de stock actual del producto' })
    getSummary(@Param('productId') id: number, @Request() req) {
      return this.stockService.getSummary(id, req.user.id);
    }
  }
  