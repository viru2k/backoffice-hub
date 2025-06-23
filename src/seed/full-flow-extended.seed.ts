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
import { Appointment, AppointmentStatus } from 'src/agenda/entities/appointment.entity';
import { AppointmentProductLog } from 'src/agenda/entities/appointment-product-log.entity';
import { Client, ClientStatus } from 'src/client/entities/client.entity'; // Importar ClientStatus
import { Holiday } from 'src/agenda/entities/holiday.entity';
import { AgendaConfig } from 'src/agenda/entities/agenda-config.entity';
import * as bcrypt from 'bcryptjs';
import { addMinutes } from 'date-fns';

// Constante de colores para el seed, usando el enum AppointmentStatus
const STATUS_COLORS_SEED: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]: '#f0ad4e',
  [AppointmentStatus.CONFIRMED]: '#3788d8',
  [AppointmentStatus.CHECKED_IN]: '#5cb85c',
  [AppointmentStatus.IN_PROGRESS]: '#28a745',
  [AppointmentStatus.COMPLETED]: '#5bc0de',
  [AppointmentStatus.CANCELLED]: '#777777',
  [AppointmentStatus.NO_SHOW]: '#d9534f',
   [AppointmentStatus.RESCHEDULED]: '#8a2be2',
};

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
    console.log('🌱 Iniciando seed extendido de flujo completo...');
    const formatDate = (date: Date): string => date.toISOString().split('T')[0];

    // 1. Crear Planes de Suscripción
    const existingPlans = await this.planRepo.count();
    if (existingPlans === 0) {
      console.log('🌱 No se encontraron planes, creando Starter y Professional...');
      const starter = await this.planRepo.save({ name: 'Starter', priceMonthly: 10, priceSemiannual: 55, priceAnnual: 100, maxUsers: 3, description: 'Plan básico' });
      const professional = await this.planRepo.save({ name: 'Professional', priceMonthly: 25, priceSemiannual: 140, priceAnnual: 260, maxUsers: 10, description: 'Plan avanzado' });
      await this.featureRepo.save([ { subscriptionPlan: starter, feature: 'Gestión básica', enabled: true }, { subscriptionPlan: professional, feature: 'Gestión avanzada', enabled: true } ]);
    }
    const starterPlan = await this.planRepo.findOneBy({ name: 'Starter' });
    const professionalPlan = await this.planRepo.findOneBy({ name: 'Professional' });

    // 2. Crear Usuarios principales y Sub-usuarios
    console.log('🌱 Creando usuarios...');
    const hashedPassword = await bcrypt.hash('12345678', 10);
    const peluqueriaAdmin = await this.userRepo.save({ email: 'peluqueria@glamour.com', password: hashedPassword, name: 'Glamour', lastName: 'Peluquería', isAdmin: true, isActive: true });
    const oftalmologiaAdmin = await this.userRepo.save({ email: 'oftalmologia@vision.com', password: hashedPassword, name: 'Clínica', lastName: 'Visión', isAdmin: true, isActive: true });

    // Crear sub-usuario para la peluquería
    const peluqueroSubUser = await this.userRepo.save({ email: 'estilista@glamour.com', password: hashedPassword, name: 'Estilista', lastName: 'Uno', owner: peluqueriaAdmin, isAdmin: false, isActive: true });

    // Asignar suscripciones
    await this.subscriptionRepo.save({ user: peluqueriaAdmin, subscriptionPlan: starterPlan, startDate: new Date(), endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), status: 'active' });
    await this.subscriptionRepo.save({ user: oftalmologiaAdmin, subscriptionPlan: professionalPlan, startDate: new Date(), endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), status: 'active' });

    // 3. Crear Configuración de Agenda
    console.log('🌱 Creando configuración de agenda...');
    const configPeluqueria = await this.agendaConfigRepo.save({ user: peluqueriaAdmin, startTime: '09:00', endTime: '18:00', slotDuration: 30, workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] });
    await this.agendaConfigRepo.save({ user: peluqueroSubUser, startTime: '09:00', endTime: '18:00', slotDuration: 30, workingDays: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] }); // Config para el sub-usuario
    const configOftalmologia = await this.agendaConfigRepo.save({ user: oftalmologiaAdmin, startTime: '08:00', endTime: '17:00', slotDuration: 15, workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], overbookingAllowed: true });

    // 4. Crear Productos
    console.log('🌱 Creando productos...');
    const shampoo = await this.productRepo.save({ name: 'Shampoo Anti-Caspa', owner: peluqueriaAdmin, user: peluqueriaAdmin, currentPrice: 10, status: 'activo' });
    const tinte = await this.productRepo.save({ name: 'Tinte Color Intenso', owner: peluqueriaAdmin, user: peluqueriaAdmin, currentPrice: 20, status: 'activo' });
    const lentes = await this.productRepo.save({ name: 'Lentes de Contacto', owner: oftalmologiaAdmin, user: oftalmologiaAdmin, currentPrice: 50, status: 'activo' });

    // 5. Crear Stock inicial
    console.log('🌱 Creando stock...');
    await this.stockRepo.save({ product: shampoo, user: peluqueriaAdmin, quantity: 100, type: StockMovementType.IN, reason: 'Carga inicial' });
    await this.stockRepo.save({ product: tinte, user: peluqueriaAdmin, quantity: 50, type: StockMovementType.IN, reason: 'Carga inicial' });
    await this.stockRepo.save({ product: lentes, user: oftalmologiaAdmin, quantity: 200, type: StockMovementType.IN, reason: 'Carga inicial' });

    // 6. Crear Clientes (USANDO EL ENUM ClientStatus)
    console.log('🌱 Creando clientes...');
    const cliente1 = await this.clientRepo.save(this.clientRepo.create({ fullname: 'Ana García', name: 'Ana', lastName: 'García', email: 'ana.garcia@example.com', phone: '555-1234', owner: peluqueriaAdmin, user: peluqueriaAdmin, status: ClientStatus.ACTIVE }));
    const paciente1 = await this.clientRepo.save(this.clientRepo.create({ fullname: 'Carlos López', name: 'Carlos', lastName: 'López', email: 'carlos.lopez@example.com', phone: '555-5678', owner: oftalmologiaAdmin, user: oftalmologiaAdmin, status: ClientStatus.ACTIVE }));

    // 7. Crear Citas (Appointments) (USANDO EL ENUM AppointmentStatus)
    console.log('🌱 Creando citas...');
    const now = new Date();
    const corteCabello = await this.appointmentRepo.save(this.appointmentRepo.create({
      title: 'Corte de Cabello', description: 'Corte y peinado para Ana',
      startDateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 0, 0),
      endDateTime: addMinutes(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 0, 0), configPeluqueria.slotDuration),
      professional: peluqueroSubUser, // Cita asignada al sub-usuario estilista
      client: cliente1,
      status: AppointmentStatus.CONFIRMED,
      color: STATUS_COLORS_SEED[AppointmentStatus.CONFIRMED],
    }));

    const consultaOftalmologica = await this.appointmentRepo.save(this.appointmentRepo.create({
      title: 'Consulta Anual', description: 'Revisión anual para Carlos',
      startDateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 14, 30, 0),
      endDateTime: addMinutes(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 14, 30, 0), configOftalmologia.slotDuration),
      professional: oftalmologiaAdmin,
      client: paciente1,
      status: AppointmentStatus.CONFIRMED,
      color: STATUS_COLORS_SEED[AppointmentStatus.CONFIRMED],
    }));

    await this.appointmentRepo.save(this.appointmentRepo.create({
      title: 'Peinado (Cancelado)', description: 'Peinado para boda',
      startDateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 15, 0, 0), 
      endDateTime: addMinutes(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 15, 0, 0), 60),
      professional: peluqueriaAdmin, // Cita asignada al admin
      client: cliente1,
      status: AppointmentStatus.CANCELLED,
      color: STATUS_COLORS_SEED[AppointmentStatus.CANCELLED],
    }));

    // 8. Crear Logs de Productos Usados
    console.log('🌱 Creando logs de productos...');
    if (corteCabello && shampoo) {
      await this.appointmentProductLogRepo.save({ appointment: corteCabello, product: shampoo, quantity: 1, priceAtTime: shampoo.currentPrice });
    }

    // 9. Crear Feriados
    console.log('🌱 Creando feriados...');
    await this.holidayRepo.save({ reason: 'Navidad', date: formatDate(new Date(now.getFullYear(), 11, 25)), user: peluqueriaAdmin });
    await this.holidayRepo.save({ reason: 'Navidad', date: formatDate(new Date(now.getFullYear(), 11, 25)), user: oftalmologiaAdmin });

    console.log('✅ Seed extendido de flujo completo finalizado!');
  }
}