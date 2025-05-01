import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlan } from 'src/subscription-plan/entities/subscription-plan.entity';
import { SubscriptionPlanFeature } from 'src/subscription-plan/entities/subscription-plan-feature.entity';
import { Subscription } from 'src/subscription/entities/subscription.entity';
import { User } from 'src/user/entities/user.entity';
import { Product } from 'src/product/entities/product.entity';
import { ProductPriceHistory } from './../product/entities/product-price-history.entity';
import { StockMovement, StockMovementType } from 'src/stock/entities/stock-movement.entity';
import { Appointment } from 'src/agenda/entities/appointment.entity';
import { AppointmentProductLog } from 'src/agenda/entities/appointment-product-log.entity';
import { Client } from 'src/client/entities/client.entity';
import { Holiday } from 'src/agenda/entities/holiday.entity';
import { AgendaConfig } from 'src/agenda/entities/agenda-config.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class FullFlowExtendedSeedService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly planRepo: Repository<SubscriptionPlan>,
    @InjectRepository(SubscriptionPlanFeature)
    private readonly featureRepo: Repository<SubscriptionPlanFeature>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductPriceHistory)
    private readonly priceLogRepo: Repository<ProductPriceHistory>,
    @InjectRepository(StockMovement)
    private readonly stockRepo: Repository<StockMovement>,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(AppointmentProductLog)
    private readonly appointmentProductLogRepo: Repository<AppointmentProductLog>,
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
    @InjectRepository(Holiday)
    private readonly holidayRepo: Repository<Holiday>,
    @InjectRepository(AgendaConfig)
    private readonly agendaConfigRepo: Repository<AgendaConfig>,
  ) {}

  async run() {
    console.log('🌱 Starting full-flow EXTENDED seed...');

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    // ================================
    // 1. Crear Planes de Suscripción
    // ================================
    const existingPlans = await this.planRepo.find();
    if (existingPlans.length === 0) {
      console.log('🌱 No se encontraron planes, creando Starter y Professional...');
      const starter = await this.planRepo.save(this.planRepo.create({
        name: 'Starter',
        priceMonthly: 10,
        priceSemiannual: 55,
        priceAnnual: 100,
        maxUsers: 3,
        description: 'Plan básico para profesionales independientes',
      }));

      const professional = await this.planRepo.save(this.planRepo.create({
        name: 'Professional',
        priceMonthly: 25,
        priceSemiannual: 140,
        priceAnnual: 260,
        maxUsers: 10,
        description: 'Plan avanzado para equipos pequeños',
      }));

      await this.featureRepo.save([
        this.featureRepo.create({ subscriptionPlan: starter, feature: 'Gestión básica de clientes' }),
        this.featureRepo.create({ subscriptionPlan: starter, feature: 'Agenda simple' }),
        this.featureRepo.create({ subscriptionPlan: professional, feature: 'Agenda avanzada' }),
        this.featureRepo.create({ subscriptionPlan: professional, feature: 'Inventario de productos' }),
      ]);
    }

    const starterPlan = await this.planRepo.findOne({ where: { name: 'Starter' } });
    const professionalPlan = await this.planRepo.findOne({ where: { name: 'Professional' } });

    // ================================
    // 2. Crear Usuarios principales
    // ================================
    const createMainUser = async (email: string, password: string, plan: SubscriptionPlan, fullName: string) => {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await this.userRepo.save(this.userRepo.create({
        email,
        password: hashedPassword,
        isAdmin: true,
        isActive: true,
        fullName,
      }));

      const now = new Date();
      const subscription = this.subscriptionRepo.create({
        user,
        subscriptionPlan: plan,
        startDate: now,
        endDate: new Date(now.setMonth(now.getMonth() + 1)),
        status: 'active',
      });
      await this.subscriptionRepo.save(subscription);

      return user;
    };

    const peluqueria = await createMainUser('peluqueria@glamour.com', '12345678', starterPlan, 'Glamour Peluquería');
    const oftalmologia = await createMainUser('oftalmologia@vision.com', '12345678', professionalPlan, 'Clínica Visión');

    // ================================
    // 3. Crear Configuración de Agenda
    // ================================
 /*    await this.agendaConfigRepo.save([
      this.agendaConfigRepo.create({ user: peluqueria, slotDuration: 30 }),
      this.agendaConfigRepo.create({ user: oftalmologia, slotDuration: 15 }),
    ]); */

    await this.agendaConfigRepo.save(this.agendaConfigRepo.create({
      startTime: '08:00', // Hora de inicio (formato HH:mm)
      endTime: '18:00',   // Hora de fin (formato HH:mm)
      slotDuration: 30,   // Duración de cada turno en minutos
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], // Días de trabajo
      overbookingAllowed: false,
      allowBookingOnBlockedDays: false,
      reminderOffsetMinutes: 30, // Avisar 30 minutos antes
      user: peluqueria, // O el usuario que corresponda
    }));

    // ================================
    // 4. Crear Productos + PriceLogs
    // ================================
    const createProduct = async (name: string, user: User, price: number) => {
      const product = await this.productRepo.save(this.productRepo.create({ name, user, currentPrice: price }));
      await this.priceLogRepo.save(this.priceLogRepo.create({
        product,
        price,
        changedAt: new Date(),
      }));
      return product;
    };

    const shampoo = await createProduct('Shampoo', peluqueria, 10);
    const tinte = await createProduct('Tinte', peluqueria, 20);
    const lentes = await createProduct('Lentes de contacto', oftalmologia, 50);
    const solucion = await createProduct('Solución para lentes', oftalmologia, 30);

    // ================================
    // 5. Crear Stock inicial
    // ================================
    const createStock = async (product: Product, user: User, quantity: number) => {
      await this.stockRepo.save(this.stockRepo.create({
        product,
        user,
        quantity,
        type: StockMovementType.IN,
        reason: 'Carga inicial',
        productNameAtTime: product.name,
        date: new Date(),
      }));
    };

    await createStock(shampoo, peluqueria, 100);
    await createStock(tinte, peluqueria, 50);
    await createStock(lentes, oftalmologia, 200);
    await createStock(solucion, oftalmologia, 100);

    // ================================
    // 6. Crear Clientes
    // ================================
    const cliente1 = await this.clientRepo.save(this.clientRepo.create({
      fullname: 'Cliente Uno',
      name: 'Cliente Uno', 
      email: 'cliente1@glamour.com',
      user: peluqueria,
    }));

    const paciente1 = await this.clientRepo.save(this.clientRepo.create({
      fullname: 'Paciente Uno',
      name: 'Paciente Uno', 
      email: 'paciente1@vision.com',
      user: oftalmologia,
    }));

    // ================================
    // 7. Crear Citas (Appointments)
    // ================================
    const now = new Date();
    const corte = await this.appointmentRepo.save(this.appointmentRepo.create({
      title: 'Corte de cabello',
      user: peluqueria,
      date: now,
      status: 'confirmed',
      client: { id: cliente1.id },
    }));

    const consulta = await this.appointmentRepo.save(this.appointmentRepo.create({
      title: 'Consulta oftalmológica',
      user: oftalmologia,
      date: now,
      status: 'confirmed',
      client: { id: paciente1.id },
    }));

    // ================================
    // 8. Crear Logs de Productos Usados en Citas
    // ================================
    await this.appointmentProductLogRepo.save([
      this.appointmentProductLogRepo.create({ appointment: corte, product: shampoo, quantity: 1, priceAtTime: 10 }),
      this.appointmentProductLogRepo.create({ appointment: consulta, product: lentes, quantity: 1, priceAtTime: 50 }),
    ]);

    // ================================
    // 9. Crear Feriados (Holidays)
    // ================================
    await this.holidayRepo.save(this.holidayRepo.create({
      reason: 'Día del trabajador',
      date: formatDate(new Date(new Date().getFullYear(), 5, 1)),
      user: peluqueria,
    }));

    await this.holidayRepo.save(this.holidayRepo.create({
      reason: 'Día de la independencia',
      date: formatDate(new Date(new Date().getFullYear(), 6, 9)),
      user: oftalmologia,
    }));

    await this.holidayRepo.save(this.holidayRepo.create({
      reason: 'Día de la raza',
      date: formatDate(new Date(new Date().getFullYear(), 10, 11)),
      user: oftalmologia,
    }));

    console.log('✅ Full flow extended seed completed!');
  }
}
