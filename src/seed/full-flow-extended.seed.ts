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
import { Appointment, AppointmentStatus } from 'src/agenda/entities/appointment.entity'; // Importar AppointmentStatus
import { AppointmentProductLog } from 'src/agenda/entities/appointment-product-log.entity';
import { Client } from 'src/client/entities/client.entity';
import { Holiday } from 'src/agenda/entities/holiday.entity';
import { AgendaConfig } from 'src/agenda/entities/agenda-config.entity';
import * as bcrypt from 'bcryptjs';
import { addMinutes } from 'date-fns'; // Para calcular endDateTime
import { STATUS_COLORS } from 'src/agenda/constants/colors';


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

    const formatDate = (date: Date): string => date.toISOString().split('T')[0]; // Para Holiday

    // ================================
    // 1. Crear Planes de Suscripción (sin cambios aquí)
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
        this.featureRepo.create({ subscriptionPlan: starter, feature: 'Gestión básica de clientes', enabled: true }),
        this.featureRepo.create({ subscriptionPlan: starter, feature: 'Agenda simple', enabled: true }),
        this.featureRepo.create({ subscriptionPlan: professional, feature: 'Agenda avanzada', enabled: true }),
        this.featureRepo.create({ subscriptionPlan: professional, feature: 'Inventario de productos', enabled: true }),
      ]);
    }

    const starterPlan = await this.planRepo.findOne({ where: { name: 'Starter' } });
    const professionalPlan = await this.planRepo.findOne({ where: { name: 'Professional' } });

    // ================================
    // 2. Crear Usuarios principales (sin cambios aquí)
    // ================================
    const createMainUser = async (email: string, password: string, plan: SubscriptionPlan, fullName: string): Promise<User> => {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await this.userRepo.save(this.userRepo.create({
        email,
        password: hashedPassword,
        isAdmin: true, // Asumimos que los usuarios principales del seed son administradores de su cuenta
        isActive: true,
        fullName,
      }));

      let subscriptionDate = new Date();
      const subscription = this.subscriptionRepo.create({
        user,
        subscriptionPlan: plan,
        startDate: subscriptionDate,
        endDate: new Date(new Date(subscriptionDate).setMonth(subscriptionDate.getMonth() + 1)), // Suscripción de 1 mes por defecto
        status: 'active',
      });
      await this.subscriptionRepo.save(subscription);
      
      // Es importante re-asignar la suscripción al usuario si la relación es bidireccional y no se maneja automáticamente
      // user.subscriptions = [subscription]; // Si User.subscriptions se debe actualizar explícitamente
      // await this.userRepo.save(user);
      return user;
    };

    const peluqueriaUser = await createMainUser('peluqueria@glamour.com', '12345678', starterPlan, 'Glamour Peluquería');
    const oftalmologiaUser = await createMainUser('oftalmologia@vision.com', '12345678', professionalPlan, 'Clínica Visión');

    // ================================
    // 3. Crear Configuración de Agenda (ACTUALIZADO)
    // ================================
    // Nota: AgendaConfig se relaciona con 'user' (el profesional)
    const configPeluqueria = this.agendaConfigRepo.create({
      user: peluqueriaUser, // La relación es 'user' en AgendaConfig
      startTime: '09:00',
      endTime: '18:00',
      slotDuration: 30,
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      overbookingAllowed: false,
      allowBookingOnBlockedDays: false,
      reminderOffsetMinutes: 60,
    });
    await this.agendaConfigRepo.save(configPeluqueria);

    const configOftalmologia = this.agendaConfigRepo.create({
      user: oftalmologiaUser, // La relación es 'user' en AgendaConfig
      startTime: '08:00',
      endTime: '17:00',
      slotDuration: 15,
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      overbookingAllowed: true,
      allowBookingOnBlockedDays: true,
      reminderOffsetMinutes: 30,
    });
    await this.agendaConfigRepo.save(configOftalmologia);


    // ================================
    // 4. Crear Productos + PriceLogs (ACTUALIZADO owner -> user)
    // ================================
    // En Product.entity, la relación con User se llama 'owner' y también 'user'. Usaremos 'owner' para el "dueño" principal.
    const createProduct = async (name: string, productOwner: User, price: number, description?: string): Promise<Product> => {
      const product = await this.productRepo.save(this.productRepo.create({ 
        name, 
        owner: productOwner, // 'owner' es la relación correcta para el creador/dueño.
        user: productOwner, // 'user' también es una relación a User en Product.entity.ts, asegúrate cuál es cuál. Asumimos que son el mismo aquí.
        currentPrice: price,
        description: description || `${name} de alta calidad`,
        status: 'activo'
      }));
      await this.priceLogRepo.save(this.priceLogRepo.create({
        product,
        price,
        changedAt: new Date(),
      }));
      return product;
    };

    const shampoo = await createProduct('Shampoo Anti-Caspa', peluqueriaUser, 10, 'Shampoo especial para combatir la caspa');
    const tinte = await createProduct('Tinte Color Intenso', peluqueriaUser, 20, 'Tinte profesional de larga duración');
    const lentes = await createProduct('Lentes de Contacto Mensuales', oftalmologiaUser, 50, 'Caja de lentes de contacto para 30 días');
    const solucion = await createProduct('Solución Limpiadora', oftalmologiaUser, 30, 'Solución para limpieza de lentes');

    // ================================
    // 5. Crear Stock inicial (ACTUALIZADO user en StockMovement)
    // ================================
    // En StockMovement.entity, la relación con User se llama 'user' (quien realiza el movimiento o a quien pertenece el stock)
    const createStock = async (product: Product, userPerformingMovement: User, quantity: number, type: StockMovementType, reason: string): Promise<void> => {
      await this.stockRepo.save(this.stockRepo.create({
        product,
        user: userPerformingMovement, // El 'user' que realiza/registra el movimiento de stock
        quantity,
        type,
        reason,
        productNameAtTime: product.name, // Guardar el nombre del producto en el momento
        date: new Date(), // Fecha del movimiento
      }));
    };

    await createStock(shampoo, peluqueriaUser, 100, StockMovementType.IN, 'Carga inicial de stock');
    await createStock(tinte, peluqueriaUser, 50, StockMovementType.IN, 'Carga inicial de stock');
    await createStock(lentes, oftalmologiaUser, 200, StockMovementType.IN, 'Carga inicial de stock');
    await createStock(solucion, oftalmologiaUser, 100, StockMovementType.IN, 'Carga inicial de stock');

    // ================================
    // 6. Crear Clientes (ACTUALIZADO owner -> user)
    // ================================
    // En Client.entity, la relación con User se llama 'owner' y también 'user'. Usaremos 'owner' para el "dueño" de la ficha del cliente.
    const cliente1 = await this.clientRepo.save(this.clientRepo.create({
      fullname: 'Ana García',
      name: 'Ana',
      lastName: 'García',
      email: 'ana.garcia@example.com',
      phone: '555-1234',
      owner: peluqueriaUser, // 'owner' es la relación correcta
      user: peluqueriaUser, // 'user' también es una relación a User en Client.entity.ts. Asumimos que son el mismo aquí.
      status: 'ACTIVE',
    }));

    const paciente1 = await this.clientRepo.save(this.clientRepo.create({
      fullname: 'Carlos López',
      name: 'Carlos',
      lastName: 'López',
      email: 'carlos.lopez@example.com',
      phone: '555-5678',
      owner: oftalmologiaUser, // 'owner' es la relación correcta
      user: oftalmologiaUser, // 'user' también es una relación a User en Client.entity.ts.
      status: 'ACTIVE',
    }));

    // ================================
    // 7. Crear Citas (Appointments) (ACTUALIZADO)
    // ================================
    const now = new Date();
    const slotDurationPeluqueria = configPeluqueria.slotDuration;
    const slotDurationOftalmologia = configOftalmologia.slotDuration;
const corteStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 0, 0);
const corteEnd = addMinutes(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 0, 0), slotDurationPeluqueria);
    const corteCabello = await this.appointmentRepo.save(this.appointmentRepo.create({
      title: 'Corte de Cabello Programado',
      description: 'Corte y peinado para Ana',
      startDateTime: corteStart,
      endDateTime: corteEnd,
      professional: peluqueriaUser, // El profesional asignado
      client: cliente1,
      status:  AppointmentStatus.CONFIRMED,
      color: STATUS_COLORS.confirmed,
      allDay: false,
      notes: 'Cliente habitual, prefiere no usar secador.',
      // serviceId: 1, // Asignar si tienes una entidad de servicios
      // roomId: 1, // Asignar si tienes una entidad de salas/recursos
    }));

    const consultaOftalmologica = await this.appointmentRepo.save(this.appointmentRepo.create({
      title: 'Consulta Oftalmológica Anual',
      description: 'Revisión anual para Carlos',
      startDateTime: corteStart,
      endDateTime: corteEnd,
      professional: oftalmologiaUser,
      client: paciente1,
      status:  AppointmentStatus.CONFIRMED,
      color: STATUS_COLORS.confirmed,
      allDay: false,
      notes: 'Traer gafas anteriores.',
    }));
    
    // Cita cancelada de ejemplo
     await this.appointmentRepo.save(this.appointmentRepo.create({
      title: 'Peinado para Evento (Cancelado)',
      description: 'Peinado para boda',
      startDateTime: corteStart,
      endDateTime: corteEnd,
      professional: peluqueriaUser,
      client: cliente1,
      status:  AppointmentStatus.CANCELLED, // Estado cancelado
      color: STATUS_COLORS.cancelled, // Color para cancelado
      allDay: false,
      notes: 'Cliente canceló por imprevisto.',
    }));


    // ================================
    // 8. Crear Logs de Productos Usados en Citas (sin cambios aquí si las entidades Appointment y Product son correctas)
    // ================================
    if (corteCabello && shampoo) {
      await this.appointmentProductLogRepo.save(
        this.appointmentProductLogRepo.create({ appointment: corteCabello, product: shampoo, quantity: 1, priceAtTime: shampoo.currentPrice })
      );
    }
    if (consultaOftalmologica && solucion) { // Asumiendo que se usa solución en una consulta
      await this.appointmentProductLogRepo.save(
        this.appointmentProductLogRepo.create({ appointment: consultaOftalmologica, product: solucion, quantity: 1, priceAtTime: solucion.currentPrice })
      );
    }


    // ================================
    // 9. Crear Feriados (Holidays) (ACTUALIZADO)
    // ================================
    // Holiday se relaciona con 'user' (el profesional para cuya agenda aplica el feriado)
    await this.holidayRepo.save(this.holidayRepo.create({
      reason: 'Día del Trabajador',
      date: formatDate(new Date(new Date().getFullYear(), 4, 1)), // 1 de Mayo (mes es 0-indexado)
      user: peluqueriaUser, // Para la agenda de Peluquería
    }));

    await this.holidayRepo.save(this.holidayRepo.create({
      reason: 'Día de la Independencia',
      date: formatDate(new Date(new Date().getFullYear(), 6, 9)), // 9 de Julio
      user: oftalmologiaUser, // Para la agenda de Oftalmología
    }));
    
    // Feriado común para ambos
    const navidadDate = formatDate(new Date(new Date().getFullYear(), 11, 25)); // 25 de Diciembre
    await this.holidayRepo.save(this.holidayRepo.create({
      reason: 'Navidad',
      date: navidadDate,
      user: peluqueriaUser,
    }));
    await this.holidayRepo.save(this.holidayRepo.create({
      reason: 'Navidad',
      date: navidadDate,
      user: oftalmologiaUser,
    }));


    console.log('✅ Seed extendido de flujo completo finalizado!');
  }
}