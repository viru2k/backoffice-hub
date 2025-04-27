import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlan } from './../subscription-plan/entities/subscription-plan.entity';
import { Subscription } from './../subscription/entities/subscription.entity';
import { User } from './../user/entities/user.entity';
import { Product } from './../product/entities/product.entity';
import { StockMovement, StockMovementType } from './../stock/entities/stock-movement.entity';
import { Appointment } from './../agenda/entities/appointment.entity';
import { Client } from './../client/entities/client.entity';
import { Holiday } from './../agenda/entities/holiday.entity'; // Ajusta si cambia la ruta
import * as bcrypt from 'bcrypt';

@Injectable()
export class FullFlowExtendedSeedService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly planRepo: Repository<SubscriptionPlan>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(StockMovement)
    private readonly stockRepo: Repository<StockMovement>,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
    @InjectRepository(Holiday)
    private readonly holidayRepo: Repository<Holiday>,
  ) {}

  async run() {
    console.log('🌱 Starting full-flow EXTENDED seed...');

    const starterPlan = await this.planRepo.findOne({ where: { name: 'Starter' } });
    const professionalPlan = await this.planRepo.findOne({ where: { name: 'Professional' } });
   
      
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    if (!starterPlan || !professionalPlan) {
      throw new Error('Subscription plans not found. Seed plans first.');
    }

    // Función para crear usuarios principales
    const createMainUser = async (email: string, password: string, plan: SubscriptionPlan) => {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = this.userRepo.create({ email, password: hashedPassword, isAdmin: true, isActive: true });
      const savedUser = await this.userRepo.save(user);

      const now = new Date();
      const end = new Date(now);
      end.setMonth(end.getMonth() + 1);

      const subscription = this.subscriptionRepo.create({
        user: savedUser,
        subscriptionPlan: plan,
        startDate: now,
        endDate: end,
        status: 'active',
      });

      await this.subscriptionRepo.save(subscription);

      savedUser.subscriptions = [subscription];
      return this.userRepo.save(savedUser);
    };

    // Función para crear subusuarios
    const createSubUser = async (email: string, password: string, owner: User) => {
      const hashedPassword = await bcrypt.hash(password, 10);
      const subUser = this.userRepo.create({
        email,
        password: hashedPassword,
        isAdmin: false,
        isActive: true,
        owner,
        subscriptions: owner.subscriptions,
      });
      return this.userRepo.save(subUser);
    };

    // 1. Crear usuarios principales
    const peluqueria = await createMainUser('peluqueria@glamour.com', '12345678', starterPlan);
    const oftalmologia = await createMainUser('oftalmologia@vision.com', '12345678', professionalPlan);

    const clienteDefault = {
        fullname: 'Cliente Default',
        email: 'default@system.com',
        phone: '000000000',
        user: peluqueria,
      };
    // 2. Crear subusuarios
    await createSubUser('recepcion@glamour.com', '12345678', peluqueria);
    await createSubUser('tecnica@glamour.com', '12345678', peluqueria);

    await createSubUser('recepcion@vision.com', '12345678', oftalmologia);
    await createSubUser('asistente@vision.com', '12345678', oftalmologia);

    // 3. Crear clientes reales + cliente default
    const cliente1 = await this.clientRepo.save(this.clientRepo.create({
        fullname: 'Cliente Uno Glamour',
        email: 'cliente1@glamour.com',
        phone: '123456789',
        user: peluqueria,
      }));
      
      const cliente2 = await this.clientRepo.save(this.clientRepo.create({
        fullname: 'Cliente Dos Glamour',
        email: 'cliente2@glamour.com',
        phone: '987654321',
        user: peluqueria,
      }));
      
      const paciente1 = await this.clientRepo.save(this.clientRepo.create({
        fullname: 'Paciente Uno Visión',
        email: 'paciente1@vision.com',
        phone: '111222333',
        user: oftalmologia,
      }));
      
      const paciente2 = await this.clientRepo.save(this.clientRepo.create({
        fullname: 'Paciente Dos Visión',
        email: 'paciente2@vision.com',
        phone: '444555666',
        user: oftalmologia,
      }));
      

    // 4. Crear productos de peluquería
    const productosPeluqueria = await Promise.all([
      this.productRepo.save(this.productRepo.create({ name: 'Shampoo', user: peluqueria })),
      this.productRepo.save(this.productRepo.create({ name: 'Tinte', user: peluqueria })),
      this.productRepo.save(this.productRepo.create({ name: 'Peine', user: peluqueria })),
      this.productRepo.save(this.productRepo.create({ name: 'Tijeras', user: peluqueria })),
      this.productRepo.save(this.productRepo.create({ name: 'Serum', user: peluqueria })),
    ]);

    // 5. Crear productos de oftalmología
    const productosOftalmologia = await Promise.all([
      this.productRepo.save(this.productRepo.create({ name: 'Lentes de contacto', user: oftalmologia })),
      this.productRepo.save(this.productRepo.create({ name: 'Solución para lentes', user: oftalmologia })),
      this.productRepo.save(this.productRepo.create({ name: 'Gotas oftálmicas', user: oftalmologia })),
      this.productRepo.save(this.productRepo.create({ name: 'Marco de lentes', user: oftalmologia })),
      this.productRepo.save(this.productRepo.create({ name: 'Limpia lentes', user: oftalmologia })),
    ]);

    // 6. Crear stock para algunos productos
    const createStock = async (product: Product, user: User, quantity: number, type: StockMovementType) => {
      await this.stockRepo.save(this.stockRepo.create({
        product,
        user,
        quantity,
        type,
        reason: 'Initial stock',
        date: new Date(),
      }));
    };

    // Stock inicial para peluquería
    await createStock(productosPeluqueria[0], peluqueria, 100, StockMovementType.IN); // Shampoo
    await createStock(productosPeluqueria[1], peluqueria, 50, StockMovementType.IN); // Tinte
    await createStock(productosPeluqueria[2], peluqueria, 0, StockMovementType.IN); // Peine (sin stock)
    await createStock(productosPeluqueria[3], peluqueria, 1, StockMovementType.IN); // Tijeras (agotado luego)

    // Stock inicial para oftalmología
    await createStock(productosOftalmologia[0], oftalmologia, 200, StockMovementType.IN);
    await createStock(productosOftalmologia[1], oftalmologia, 150, StockMovementType.IN);
    await createStock(productosOftalmologia[2], oftalmologia, 0, StockMovementType.IN);
    await createStock(productosOftalmologia[3], oftalmologia, 1, StockMovementType.IN);

    // 7. Crear turnos normales y sobre-turnos
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    await this.appointmentRepo.save(this.appointmentRepo.create({
      title: 'Corte de cabello - Cliente Uno',
      user: peluqueria,
      date: now,
      status: 'confirmed',
      client: { id: cliente1[0].id }
    }));

    await this.appointmentRepo.save(this.appointmentRepo.create({
      title: 'Coloración - Cliente Dos',
      user: peluqueria,
      date: tomorrow,
      status: 'completed',
      client: { id: cliente2[0].id }
    }));

    await this.appointmentRepo.save(this.appointmentRepo.create({
      title: 'Consulta médica',
      user: oftalmologia,
      date: now,
      status: 'no_show',
      client: { id: paciente1[0].id }
    }));

    await this.appointmentRepo.save(this.appointmentRepo.create({
      title: 'Control de visión - Paciente Dos',
      user: oftalmologia,
      date: tomorrow,
      status: 'cancelled',
      client: { id: paciente2[0].id }
    }));

    // 8. Crear un sobre-turno (fuera de horario)
    const sobreTurno = new Date(now);
    sobreTurno.setHours(23);

    await this.appointmentRepo.save(this.appointmentRepo.create({
      title: 'Sobre-turno urgente',
      user: oftalmologia,
      date: sobreTurno,
      status: 'confirmed',
      client: clienteDefault,
    }));

    // 9. Crear días festivos bloqueados
    await this.holidayRepo.save(this.holidayRepo.create({
        reason: 'Día del trabajador',
        date: formatDate(new Date(new Date().getFullYear(), 4, 1)),
        user: oftalmologia,
      }));


      await this.holidayRepo.save(this.holidayRepo.create({
        reason: 'Navidad',
        date: formatDate(new Date(new Date().getFullYear(), 25, 12)),
        user: oftalmologia,
      }));

      await this.holidayRepo.save(this.holidayRepo.create({
        reason: 'Anio nuevo',
        date: formatDate(new Date(new Date().getFullYear(), 1, 1)),
        user: oftalmologia,
      }));


      await this.holidayRepo.save(this.holidayRepo.create({
        reason: 'Día del trabajador',
        date: formatDate(new Date(new Date().getFullYear(), 4, 1)),
        user: peluqueria,
      }));


      await this.holidayRepo.save(this.holidayRepo.create({
        reason: 'Navidad',
        date: formatDate(new Date(new Date().getFullYear(), 25, 12)),
        user: peluqueria,
      }));

      await this.holidayRepo.save(this.holidayRepo.create({
        reason: 'Anio nuevo',
        date: formatDate(new Date(new Date().getFullYear(), 1, 1)),
        user: peluqueria,
      }));


    console.log('✅ Full flow extended seed completed!');
  }
}
