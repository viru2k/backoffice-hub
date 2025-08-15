import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { ProcessPaymentDto } from './dto/payment.dto';
import { Product } from '../product/entities/product.entity';
import { StockService } from '../stock/stock.service';
import { NotificationGateway } from '../notification/notification.gateway';
import { EmailService } from '../email/email.service';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private readonly invoiceItemRepo: Repository<InvoiceItem>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly dataSource: DataSource,
    private readonly stockService: StockService,
    private readonly notificationGateway: NotificationGateway,
    private readonly emailService: EmailService,
  ) {}

  private generateInvoiceNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${timestamp}-${random}`;
  }

  async create(createDto: CreateInvoiceDto, userId: number): Promise<Invoice> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const invoiceNumber = this.generateInvoiceNumber();

      // Crear la factura
      const invoice = this.invoiceRepo.create({
        ...createDto,
        userId,
        invoiceNumber,
        dueDate: createDto.dueDate ? new Date(createDto.dueDate) : null,
        subtotal: 0,
        tax: 0,
        total: 0,
        remainingAmount: 0,
      });

      const savedInvoice = await queryRunner.manager.save(Invoice, invoice);

      // Crear los items de la factura
      const items = [];
      for (const itemDto of createDto.items) {
        const item = this.invoiceItemRepo.create({
          ...itemDto,
          invoiceId: savedInvoice.id,
          total: 0,
        });

        // Calcular total del item
        item.calculateTotal();
        const savedItem = await queryRunner.manager.save(InvoiceItem, item);
        items.push(savedItem);
      }

      // Recalcular totales de la factura
      savedInvoice.items = items;
      savedInvoice.calculateTotals();
      await queryRunner.manager.save(Invoice, savedInvoice);

      await queryRunner.commitTransaction();

      // Notificar por WebSocket
      await this.notificationGateway.sendNotificationToUser(userId, {
        type: 'invoice_created',
        title: 'Nueva Factura Creada',
        message: `Factura ${invoiceNumber} por $${savedInvoice.total} creada exitosamente`,
        data: { invoiceId: savedInvoice.id },
        timestamp: new Date().toISOString(),
      });

      return this.findOne(savedInvoice.id, userId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    userId: number,
    page: number = 1,
    limit: number = 10,
    status?: string,
    clientId?: number,
  ): Promise<{ data: Invoice[]; total: number; page: number; limit: number }> {
    const query = this.invoiceRepo
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.client', 'client')
      .leftJoinAndSelect('invoice.user', 'user')
      .leftJoinAndSelect('invoice.consultation', 'consultation')
      .leftJoinAndSelect('invoice.items', 'items')
      .where('invoice.userId = :userId', { userId });

    if (status) {
      query.andWhere('invoice.status = :status', { status });
    }

    if (clientId) {
      query.andWhere('invoice.clientId = :clientId', { clientId });
    }

    query
      .orderBy('invoice.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await query.getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: number, userId: number): Promise<Invoice> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id, userId },
      relations: [
        'client',
        'user',
        'consultation',
        'items',
        'items.product',
        'items.service',
      ],
    });

    if (!invoice) {
      throw new NotFoundException('Factura no encontrada');
    }

    return invoice;
  }

  async update(id: number, updateDto: UpdateInvoiceDto, userId: number): Promise<Invoice> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const invoice = await this.findOne(id, userId);

      if (invoice.isPaid) {
        throw new BadRequestException('No se puede modificar una factura pagada');
      }

      // Actualizar la factura
      const updateData = {
        ...updateDto,
        dueDate: updateDto.dueDate ? new Date(updateDto.dueDate) : invoice.dueDate,
      };

      await queryRunner.manager.update(Invoice, id, updateData);

      // Si hay nuevos items, reemplazar todos
      if (updateDto.items) {
        // Eliminar items existentes
        await queryRunner.manager.delete(InvoiceItem, { invoiceId: id });

        // Crear nuevos items
        const items = [];
        for (const itemDto of updateDto.items) {
          const item = this.invoiceItemRepo.create({
            ...itemDto,
            invoiceId: id,
            total: 0,
          });

          item.calculateTotal();
          const savedItem = await queryRunner.manager.save(InvoiceItem, item);
          items.push(savedItem);
        }

        // Recalcular totales
        const updatedInvoice = await queryRunner.manager.findOne(Invoice, {
          where: { id },
          relations: ['items'],
        });
        updatedInvoice.items = items;
        updatedInvoice.calculateTotals();
        await queryRunner.manager.save(Invoice, updatedInvoice);
      }

      await queryRunner.commitTransaction();

      return this.findOne(id, userId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async processPayment(id: number, paymentDto: ProcessPaymentDto, userId: number): Promise<Invoice> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const invoice = await this.findOne(id, userId);

      if (invoice.isPaid) {
        throw new BadRequestException('Esta factura ya está pagada');
      }

      const newPaidAmount = Number(invoice.paidAmount) + Number(paymentDto.amount);
      const isPaid = newPaidAmount >= Number(invoice.total);

      await queryRunner.manager.update(Invoice, id, {
        paymentMethod: paymentDto.paymentMethod,
        paymentDate: paymentDto.paymentDate ? new Date(paymentDto.paymentDate) : new Date(),
        paymentReference: paymentDto.paymentReference,
        paymentNotes: paymentDto.paymentNotes,
        paidAmount: newPaidAmount,
        remainingAmount: Number(invoice.total) - newPaidAmount,
        isPaid,
        status: isPaid ? 'paid' : 'pending',
      });

      // Si la factura está completamente pagada, descontar productos del stock
      if (isPaid) {
        for (const item of invoice.items) {
          if (item.itemType === 'product') {
            await this.stockService.createMovement({
              productId: item.itemId,
              type: 'out',
              quantity: item.quantity,
              notes: `Venta - Factura ${invoice.invoiceNumber}`,
            }, userId);
          }
        }

        // Notificar pago completado
        await this.notificationGateway.sendNotificationToUser(userId, {
          type: 'invoice_paid',
          title: 'Factura Pagada',
          message: `Factura ${invoice.invoiceNumber} ha sido pagada completamente`,
          data: { invoiceId: id, amount: paymentDto.amount },
          timestamp: new Date().toISOString(),
        });
      }

      await queryRunner.commitTransaction();

      return this.findOne(id, userId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async cancel(id: number, userId: number): Promise<Invoice> {
    const invoice = await this.findOne(id, userId);

    if (invoice.isPaid) {
      throw new BadRequestException('No se puede cancelar una factura pagada');
    }

    await this.invoiceRepo.update(id, { status: 'cancelled' });

    await this.notificationGateway.sendNotificationToUser(userId, {
      type: 'invoice_cancelled',
      title: 'Factura Cancelada',
      message: `Factura ${invoice.invoiceNumber} ha sido cancelada`,
      data: { invoiceId: id },
      timestamp: new Date().toISOString(),
    });

    return this.findOne(id, userId);
  }

  async delete(id: number, userId: number): Promise<void> {
    const invoice = await this.findOne(id, userId);

    if (invoice.isPaid) {
      throw new BadRequestException('No se puede eliminar una factura pagada');
    }

    await this.invoiceRepo.delete(id);
  }

  async getPendingInvoices(userId: number): Promise<Invoice[]> {
    return this.invoiceRepo.find({
      where: { userId, status: 'pending' },
      relations: ['client', 'items'],
      order: { dueDate: 'ASC' },
    });
  }

  async getOverdueInvoices(userId: number): Promise<Invoice[]> {
    const today = new Date();
    
    return this.invoiceRepo
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.client', 'client')
      .leftJoinAndSelect('invoice.items', 'items')
      .where('invoice.userId = :userId', { userId })
      .andWhere('invoice.status IN (:...statuses)', { statuses: ['pending', 'overdue'] })
      .andWhere('invoice.dueDate < :today', { today })
      .andWhere('invoice.isPaid = false')
      .orderBy('invoice.dueDate', 'ASC')
      .getMany();
  }

  async getSalesStats(userId: number, startDate?: Date, endDate?: Date): Promise<any> {
    const query = this.invoiceRepo
      .createQueryBuilder('invoice')
      .where('invoice.userId = :userId', { userId })
      .andWhere('invoice.status = :status', { status: 'paid' });

    if (startDate) {
      query.andWhere('invoice.paymentDate >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('invoice.paymentDate <= :endDate', { endDate });
    }

    const invoices = await query.getMany();

    const totalSales = invoices.reduce((sum, invoice) => sum + Number(invoice.total), 0);
    const totalInvoices = invoices.length;
    const averageInvoice = totalInvoices > 0 ? totalSales / totalInvoices : 0;

    return {
      totalSales,
      totalInvoices,
      averageInvoice,
      period: {
        startDate: startDate || 'N/A',
        endDate: endDate || 'N/A',
      },
    };
  }

  async getTodaySales(userId: number): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const invoices = await this.invoiceRepo.find({
      where: {
        userId,
        status: 'paid',
        paymentDate: {
          $gte: today,
          $lt: tomorrow,
        } as any,
      },
      relations: ['client', 'items'],
    });

    const totalSales = invoices.reduce((sum, invoice) => sum + Number(invoice.total), 0);

    return {
      totalSales,
      totalInvoices: invoices.length,
      invoices,
    };
  }
}