import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlan } from 'src/subscription-plan/entities/subscription-plan.entity';
import { Subscription } from 'src/subscription/entities/subscription.entity';
import { User } from 'src/user/entities/user.entity';
import { Product } from 'src/product/entities/product.entity'; // Ajusta si tu ruta es distinta
import { StockMovement } from 'src/stock/entities/stock-movement.entity'; // Ajusta si tu ruta es distinta
import { Appointment } from 'src/agenda/entities/appointment.entity'; // Ajusta si tu ruta es distinta
import * as bcrypt from 'bcrypt';

@Injectable()
export class FullFlowSeedService {
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
  ) {}

  async run() {
    console.log('🌱 Starting full flow seed...');

    // 1. Buscar los planes existentes
    const starterPlan = await this.planRepo.findOne({ where: { name: 'Starter' } });
    const professionalPlan = await this.planRepo.findOne({ where: { name: 'Professional' } });

    if (!starterPlan || !professionalPlan) {
      throw new Error('Subscription plans not found. Seed plans first.');
    }

    // Función helper para crear usuarios principales
    const createMainUser = async (email: string, password: string, plan: SubscriptionPlan) => {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = this.userRepo.create({
        email,
        password: hashedPassword,
        isAdmin: true,
        isActive: true,
      });
      const savedUser = await this.userRepo.save(user);

      const now = new Date();
      const end = new Date(now);
      end.setMonth(end.getMonth() + 1); // Starter o Professional (monthly for now)

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

    // Función helper para crear subusuarios
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

    // 2. Crear usuarios principales
    const peluqueria = await createMainUser('peluqueria@glamour.com', '12345678', starterPlan);
    const oftalmologia = await createMainUser('oftalmologia@vision.com', '12345678', professionalPlan);

    // 3. Crear subusuarios
    await createSubUser('recepcion@glamour.com', '12345678', peluqueria);
    await createSubUser('tecnica@glamour.com', '12345678', peluqueria);

    await createSubUser('recepcion@vision.com', '12345678', oftalmologia);
    await createSubUser('asistente@vision.com', '12345678', oftalmologia);

    // 4. Crear productos para peluquería
    const shampoo = await this.productRepo.save(this.productRepo.create({ name: 'Shampoo', user: peluqueria }));
    const tinte = await this.productRepo.save(this.productRepo.create({ name: 'Tinte', user: peluqueria }));
    const peine = await this.productRepo.save(this.productRepo.create({ name: 'Peine', user: peluqueria }));

    // 5. Crear productos para oftalmología
    const lentes = await this.productRepo.save(this.productRepo.create({ name: 'Lentes de contacto', user: oftalmologia }));
    const solucion = await this.productRepo.save(this.productRepo.create({ name: 'Solución para lentes', user: oftalmologia }));
    const gotas = await this.productRepo.save(this.productRepo.create({ name: 'Gotas oftálmicas', user: oftalmologia }));

    // 6. Crear movimientos de stock
    const createStock = async (product: Product, user: User, quantity: number) => {
      await this.stockRepo.save(this.stockRepo.create({
        product,
        user,
        quantity,
        type: 'in',
        reason: 'Initial stock',
        date: new Date(),
      }));
    };

    await createStock(shampoo, peluqueria, 100);
    await createStock(tinte, peluqueria, 100);
    await createStock(peine, peluqueria, 100);

    await createStock(lentes, oftalmologia, 200);
    await createStock(solucion, oftalmologia, 200);
    await createStock(gotas, oftalmologia, 200);

    // 7. Crear agendas
    const createAppointment = async (title: string, user: User, date: Date) => {
      await this.appointmentRepo.save(this.appointmentRepo.create({
        title,
        user,
        date,
        status: 'confirmed',
      }));
    };

    await createAppointment('Corte de cabello - Cliente 1', peluqueria, new Date());
    await createAppointment('Coloración - Cliente 2', peluqueria, new Date());

    await createAppointment('Consulta médica - Paciente 1', oftalmologia, new Date());
    await createAppointment('Control de visión - Paciente 2', oftalmologia, new Date());

    console.log('✅ Full flow seed completed!');
  }
}
