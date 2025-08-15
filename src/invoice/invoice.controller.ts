import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { ProcessPaymentDto } from './dto/payment.dto';
import { InvoiceResponseDto } from './dto/invoice-response.dto';

@ApiTags('invoices')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nueva factura' })
  @ApiResponse({ status: 201, type: InvoiceResponseDto })
  create(@Body() createDto: CreateInvoiceDto, @Request() req) {
    return this.invoiceService.create(createDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar facturas del usuario' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Elementos por página' })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por estado' })
  @ApiQuery({ name: 'clientId', required: false, description: 'Filtrar por cliente' })
  @ApiResponse({ status: 200, type: [InvoiceResponseDto] })
  findAll(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.invoiceService.findAll(
      req.user.id,
      parseInt(page),
      parseInt(limit),
      status,
      clientId ? parseInt(clientId) : undefined,
    );
  }

  @Get('pending')
  @ApiOperation({ summary: 'Obtener facturas pendientes' })
  @ApiResponse({ status: 200, type: [InvoiceResponseDto] })
  getPendingInvoices(@Request() req) {
    return this.invoiceService.getPendingInvoices(req.user.id);
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Obtener facturas vencidas' })
  @ApiResponse({ status: 200, type: [InvoiceResponseDto] })
  getOverdueInvoices(@Request() req) {
    return this.invoiceService.getOverdueInvoices(req.user.id);
  }

  @Get('stats/sales')
  @ApiOperation({ summary: 'Obtener estadísticas de ventas' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Fecha de inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Fecha de fin (YYYY-MM-DD)' })
  @ApiResponse({ status: 200 })
  getSalesStats(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.invoiceService.getSalesStats(
      req.user.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('stats/today')
  @ApiOperation({ summary: 'Obtener ventas de hoy' })
  @ApiResponse({ status: 200 })
  getTodaySales(@Request() req) {
    return this.invoiceService.getTodaySales(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener factura por ID' })
  @ApiResponse({ status: 200, type: InvoiceResponseDto })
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.invoiceService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar factura' })
  @ApiResponse({ status: 200, type: InvoiceResponseDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateInvoiceDto,
    @Request() req,
  ) {
    return this.invoiceService.update(id, updateDto, req.user.id);
  }

  @Post(':id/pay')
  @ApiOperation({ summary: 'Procesar pago de factura' })
  @ApiResponse({ status: 200, type: InvoiceResponseDto })
  processPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() paymentDto: ProcessPaymentDto,
    @Request() req,
  ) {
    return this.invoiceService.processPayment(id, paymentDto, req.user.id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancelar factura' })
  @ApiResponse({ status: 200, type: InvoiceResponseDto })
  cancel(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.invoiceService.cancel(id, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar factura' })
  @ApiResponse({ status: 204 })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.invoiceService.delete(id, req.user.id);
  }
}