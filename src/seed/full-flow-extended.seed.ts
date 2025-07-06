import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { SubscriptionPlan } from 'src/subscription-plan/entities/subscription-plan.entity';
import { Subscription } from 'src/subscription/entities/subscription.entity';
import { User } from 'src/user/entities/user.entity';
import { Product } from 'src/product/entities/product.entity';
import { ProductPriceHistory } from './../product/entities/product-price-history.entity';
import { StockMovement, StockMovementType } from 'src/stock/entities/stock-movement.entity';
import { Appointment, AppointmentStatus } from 'src/agenda/entities/appointment.entity';
import { AppointmentProductLog } from 'src/agenda/entities/appointment-product-log.entity';
import { Client, ClientStatus } from 'src/client/entities/client.entity';
import { Holiday } from 'src/agenda/entities/holiday.entity';
import { AgendaConfig } from 'src/agenda/entities/agenda-config.entity';
import { Role } from 'src/roles/entities/role.entity';
import { Permission } from 'src/permissions/entities/permission.entity';
import * as bcrypt from 'bcryptjs';
import { addMinutes } from 'date-fns';
import { SubscriptionPlanFeature } from 'src/subscription-plan/entities/subscription-plan-feature.entity';

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
    ];
    await this.permissionRepo.save(permissionsData);
    const allPermissions = await this.permissionRepo.find();

    // 2. CREAR ROLES
    this.logger.log('🌱 Creando roles...');
    const getPerms = (...names: string[]) => allPermissions.filter(p => names.includes(p.name));
    const adminRole = await this.roleRepo.save({ name: 'Admin de Cuenta', description: 'Acceso total a la cuenta.', permissions: allPermissions });
    const profesionalRole = await this.roleRepo.save({ name: 'Profesional', description: 'Gestiona su agenda y clientes.', permissions: getPerms('agenda:read:own', 'agenda:write:own', 'client:manage:group') });
    const secretariaRole = await this.roleRepo.save({ name: 'Secretaria', description: 'Gestiona agendas y clientes del grupo.', permissions: getPerms('agenda:read:group', 'agenda:write:group', 'client:manage:group') });

    // 3. CREAR PLANES DE SUSCRIPCIÓN
    this.logger.log('🌱 Creando planes de suscripción...');
    const starterPlan = await this.planRepo.save({ name: 'Starter', priceMonthly: 10, priceSemiannual: 55, priceAnnual: 100, maxUsers: 3, description: 'Plan para empezar' });
    const professionalPlan = await this.planRepo.save({ name: 'Professional', priceMonthly: 25, priceSemiannual: 140, priceAnnual: 260, maxUsers: 10, description: 'Plan para equipos' });
    
    // 4. CREAR USUARIOS, ROLES Y SUSCRIPCIONES
    this.logger.log('🌱 Creando usuarios...');
    const hashedPassword = await bcrypt.hash('12345678', 10);
    const clinicaAdmin = await this.userRepo.save({ email: 'admin@clinica.com', password: hashedPassword, name: 'Admin', lastName: 'Clínica', roles: [adminRole] });
    await this.subscriptionRepo.save({ user: clinicaAdmin, subscriptionPlan: professionalPlan, status: 'active', startDate: new Date(), endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)) });
    const medicoUno = await this.userRepo.save({ email: 'medico1@clinica.com', password: hashedPassword, name: 'Dr.', lastName: 'Arias', owner: clinicaAdmin, roles: [profesionalRole] });
    const medicoDos = await this.userRepo.save({ email: 'medico2@clinica.com', password: hashedPassword, name: 'Dra.', lastName: 'Gomez', owner: clinicaAdmin, roles: [profesionalRole] });
    const secretariaClinica = await this.userRepo.save({ email: 'secretaria@clinica.com', password: hashedPassword, name: 'Laura', lastName: 'Velez', owner: clinicaAdmin, roles: [secretariaRole] });

    // 5. CREAR CONFIGURACIÓN DE AGENDA (CORREGIDO)
    this.logger.log('🌱 Creando configuración de agenda...');
    await this.agendaConfigRepo.save({ user: medicoUno, startTime: '09:00', endTime: '17:00', slotDuration: 20, workingDays: ['Monday', 'Wednesday', 'Friday'] });
    await this.agendaConfigRepo.save({ user: medicoDos, startTime: '08:00', endTime: '16:00', slotDuration: 30, workingDays: ['Tuesday', 'Thursday'] });

    // 6. CREAR CLIENTES Y CITAS
    this.logger.log('🌱 Creando clientes y citas...');
    const pacienteClinica = await this.clientRepo.save({ fullname: 'Roberto Carlos', name: 'Roberto', lastName: 'Carlos', owner: clinicaAdmin, user: clinicaAdmin, status: ClientStatus.ACTIVE });
    const now = new Date();
    await this.appointmentRepo.save({ title: 'Control Anual - R. Carlos', startDateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 0, 0), endDateTime: addMinutes(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 0, 0), 20), professional: medicoUno, client: pacienteClinica, status: AppointmentStatus.CONFIRMED });
    await this.appointmentRepo.save({ title: 'Consulta Urgente - R. Carlos', startDateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 11, 0, 0), endDateTime: addMinutes(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 11, 0, 0), 30), professional: medicoDos, client: pacienteClinica, status: AppointmentStatus.CONFIRMED });

    this.logger.log('✅ Seed con RBAC finalizado!');
    this.logger.log('--- Credenciales de Prueba ---');
    this.logger.log('Admin Clínica: admin@clinica.com / 12345678');
    this.logger.log('Médico 1: medico1@clinica.com / 12345678');
    this.logger.log('Médico 2: medico2@clinica.com / 12345678');
    this.logger.log('Secretaria: secretaria@clinica.com / 12345678');
  }
}