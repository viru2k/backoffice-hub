import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { SubscriptionPlan } from '../subscription-plan/entities/subscription-plan.entity';
import { Subscription } from '../subscription/entities/subscription.entity';
import { User } from '../user/entities/user.entity';
import { Product } from '../product/entities/product.entity';
import { ProductPriceHistory } from './../product/entities/product-price-history.entity';
import { StockMovement, StockMovementType } from '../stock/entities/stock-movement.entity';
import { Appointment, AppointmentStatus } from '../agenda/entities/appointment.entity';
import { AppointmentProductLog } from '../agenda/entities/appointment-product-log.entity';
import { Client, ClientStatus } from '../client/entities/client.entity';
import { Holiday } from '../agenda/entities/holiday.entity';
import { AgendaConfig } from '../agenda/entities/agenda-config.entity';
import { Role } from '../roles/entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';
import * as bcrypt from 'bcryptjs';
import { addMinutes } from 'date-fns';
import { SubscriptionPlanFeature } from '../subscription-plan/entities/subscription-plan-feature.entity';

@Injectable()
export class FullFlowExtendedSeedService {
  private readonly logger = new Logger(FullFlowExtendedSeedService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(SubscriptionPlan) private readonly planRepo: Repository<SubscriptionPlan>,
    @InjectRepository(Subscription) private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductPriceHistory) private readonly priceLogRepo: Repository<ProductPriceHistory>,
    @InjectRepository(StockMovement) private readonly stockRepo: Repository<StockMovement>,
    @InjectRepository(Appointment) private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(AppointmentProductLog) private readonly appointmentProductLogRepo: Repository<AppointmentProductLog>,
    @InjectRepository(Client) private readonly clientRepo: Repository<Client>,
    @InjectRepository(Holiday) private readonly holidayRepo: Repository<Holiday>,
    @InjectRepository(AgendaConfig) private readonly agendaConfigRepo: Repository<AgendaConfig>,
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission) private readonly permissionRepo: Repository<Permission>,
    @InjectRepository(SubscriptionPlanFeature) private readonly featureRepo: Repository<SubscriptionPlanFeature>,
  ) {}

  private async cleanDatabase() {
    this.logger.log('🧹 Limpiando la base de datos...');
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    const tables = await queryRunner.query("SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()");
    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0;');
    for (const table of tables) {
      const tableName = Object.values(table)[0] as string;
      this.logger.debug(`Truncando tabla: ${tableName}`);
      await queryRunner.query(`TRUNCATE TABLE \`${tableName}\`;`);
    }
    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1;');
    await queryRunner.release();
    this.logger.log('✅ Base de datos limpiada.');
  }

  async run() {
    await this.cleanDatabase();
    this.logger.log('🌱 Iniciando seed con sistema de Roles y Permisos (RBAC)...');

    // 1. CREAR PERMISOS
    this.logger.log('🌱 Creando permisos...');
    const permissionsData = [
      { name: 'agenda:read:own', description: 'Ver la agenda propia' },
      { name: 'agenda:read:group', description: 'Ver la agenda de todos en el grupo' },
      { name: 'agenda:write:own', description: 'Crear/editar en la agenda propia' },
      { name: 'agenda:write:group', description: 'Crear/editar en la agenda de todos en el grupo' },
      { name: 'client:manage:group', description: 'Crear/editar/eliminar clientes del grupo' },
      { name: 'product:manage:group', description: 'Crear/editar/eliminar productos del grupo' },
      { name: 'user:manage:group', description: 'Crear/editar/eliminar sub-usuarios del grupo' },
      { name: 'role:manage', description: 'Gestionar roles y sus permisos' },
    ];
    await this.permissionRepo.save(permissionsData);
    const allPermissions = await this.permissionRepo.find();

    // 2. CREAR ROLES
    this.logger.log('🌱 Creando roles...');
    const getPerms = (...names: string[]) => allPermissions.filter(p => names.includes(p.name));
    const adminRole = await this.roleRepo.save({ name: 'Admin de Cuenta', description: 'Acceso total a la cuenta.', permissions: allPermissions });
    const profesionalRole = await this.roleRepo.save({ name: 'Profesional', description: 'Gestiona su agenda y clientes.', permissions: getPerms('agenda:read:own', 'agenda:write:own', 'client:manage:group', 'product:manage:group') });
    const secretariaRole = await this.roleRepo.save({ name: 'Secretaria', description: 'Gestiona agendas y clientes del grupo.', permissions: getPerms('agenda:read:group', 'agenda:write:group', 'client:manage:group') });

    // 3. CREAR PLANES DE SUSCRIPCIÓN
    this.logger.log('🌱 Creando planes de suscripción...');
    const starterPlan = await this.planRepo.save({ name: 'Starter', priceMonthly: 10, priceSemiannual: 55, priceAnnual: 100, maxUsers: 3, description: 'Plan para empezar' });
    const professionalPlan = await this.planRepo.save({ name: 'Professional', priceMonthly: 25, priceSemiannual: 140, priceAnnual: 260, maxUsers: 10, description: 'Plan para equipos' });
    
    // 4. CREAR USUARIOS, ROLES Y SUSCRIPCIONES
    this.logger.log('🌱 Creando usuarios...');
    const hashedPassword = await bcrypt.hash('12345678', 10);
    
    // -- Cuenta "Peluquería Glamour" --
    const peluqueriaAdmin = await this.userRepo.save({ email: 'peluqueria@glamour.com', password: hashedPassword, name: 'Admin', lastName: 'Glamour', roles: [adminRole] });
    await this.subscriptionRepo.save({ user: peluqueriaAdmin, subscriptionPlan: starterPlan, status: 'active', startDate: new Date(), endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)) });
    const estilistaUno = await this.userRepo.save({ email: 'estilista@glamour.com', password: hashedPassword, name: 'Carlos', lastName: 'Estilista', owner: peluqueriaAdmin, roles: [profesionalRole] });
    const secretariaPeluqueria = await this.userRepo.save({ email: 'recepcion@glamour.com', password: hashedPassword, name: 'Laura', lastName: 'Recepcionista', owner: peluqueriaAdmin, roles: [secretariaRole] });

    // -- Cuenta "Clínica Visión" --
    const oftalmologiaAdmin = await this.userRepo.save({ email: 'oftalmologia@vision.com', password: hashedPassword, name: 'Admin', lastName: 'Visión', roles: [adminRole] });
    await this.subscriptionRepo.save({ user: oftalmologiaAdmin, subscriptionPlan: professionalPlan, status: 'active', startDate: new Date(), endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)) });
    const medicoOftalmologo = await this.userRepo.save({ email: 'medico@vision.com', password: hashedPassword, name: 'Dr.', lastName: 'Arias', owner: oftalmologiaAdmin, roles: [profesionalRole] });

    // 5. CREAR CONFIGURACIÓN DE AGENDA
    this.logger.log('🌱 Creando configuración de agenda...');
    await this.agendaConfigRepo.save({ user: estilistaUno, startTime: '09:00', endTime: '18:00', slotDuration: 45, workingDays: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] });
    await this.agendaConfigRepo.save({ user: medicoOftalmologo, startTime: '08:00', endTime: '16:00', slotDuration: 20, workingDays: ['Monday', 'Wednesday', 'Friday'] });
    
    // 6. CREAR CLIENTES Y PRODUCTOS
    this.logger.log('🌱 Creando clientes y productos...');
    const clientePeluqueria = await this.clientRepo.save({ fullname: 'Ana Torres', name: 'Ana', lastName: 'Torres', owner: peluqueriaAdmin, user: peluqueriaAdmin, status: ClientStatus.ACTIVE });
    const pacienteOftalmologia = await this.clientRepo.save({ fullname: 'Roberto Sanz', name: 'Roberto', lastName: 'Sanz', owner: oftalmologiaAdmin, user: oftalmologiaAdmin, status: ClientStatus.ACTIVE });
    const shampoo = await this.productRepo.save({ name: 'Shampoo Profesional', owner: peluqueriaAdmin, user: peluqueriaAdmin, currentPrice: 25, status: 'activo' });

    // 7. CREAR CITAS
    this.logger.log('🌱 Creando citas...');
    const now = new Date();
    await this.appointmentRepo.save({ title: 'Corte y Color - Ana Torres', startDateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 11, 0, 0), endDateTime: addMinutes(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 11, 0, 0), 90), professional: estilistaUno, client: clientePeluqueria, status: AppointmentStatus.CONFIRMED });
    await this.appointmentRepo.save({ title: 'Control Anual - Roberto Sanz', startDateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 10, 0, 0), endDateTime: addMinutes(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 10, 0, 0), 20), professional: medicoOftalmologo, client: pacienteOftalmologia, status: AppointmentStatus.CONFIRMED });

    this.logger.log('✅ Seed con RBAC finalizado!');
    this.logger.log('--- Credenciales de Prueba ---');
    this.logger.log('Admin Peluquería: peluqueria@glamour.com / 12345678');
    this.logger.log('Estilista: estilista@glamour.com / 12345678');
    this.logger.log('Secretaria Peluquería: recepcion@glamour.com / 12345678');
    this.logger.log('Admin Oftalmología: oftalmologia@vision.com / 12345678');
    this.logger.log('Médico: medico@vision.com / 12345678');
  }
}