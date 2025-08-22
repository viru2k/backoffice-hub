import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BusinessTypeSeedService } from './business-type.seed';
import { RewardsSeedService } from './rewards.seed';
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
import { Service } from '../agenda/entities/service.entity';
import { Room } from '../agenda/entities/room.entity';
import { Role } from '../roles/entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';
import * as bcrypt from 'bcryptjs';
import { addMinutes } from 'date-fns';
import { SubscriptionPlanFeature } from '../subscription-plan/entities/subscription-plan-feature.entity';
import { Consultation } from '../consultation/entities/consultation.entity';
import { Invoice } from '../invoice/entities/invoice.entity';
import { InvoiceItem } from '../invoice/entities/invoice-item.entity';

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
    @InjectRepository(Service) private readonly serviceRepo: Repository<Service>,
    @InjectRepository(Room) private readonly roomRepo: Repository<Room>,
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission) private readonly permissionRepo: Repository<Permission>,
    @InjectRepository(SubscriptionPlanFeature) private readonly featureRepo: Repository<SubscriptionPlanFeature>,
    @InjectRepository(Consultation) private readonly consultationRepo: Repository<Consultation>,
    @InjectRepository(Invoice) private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(InvoiceItem) private readonly invoiceItemRepo: Repository<InvoiceItem>,
    private readonly businessTypeSeedService: BusinessTypeSeedService,
    private readonly rewardsSeedService: RewardsSeedService,
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
    const peluqueriaAdmin = await this.userRepo.save({ email: 'peluqueria@glamour.com', password: hashedPassword, name: 'Admin', lastName: 'Glamour', isAdmin: true, roles: [adminRole] });
    await this.subscriptionRepo.save({ user: peluqueriaAdmin, subscriptionPlan: starterPlan, status: 'active', startDate: new Date(), endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)) });
    const estilistaUno = await this.userRepo.save({ email: 'estilista@glamour.com', password: hashedPassword, name: 'Carlos', lastName: 'Estilista', owner: peluqueriaAdmin, roles: [profesionalRole] });
    const secretariaPeluqueria = await this.userRepo.save({ email: 'recepcion@glamour.com', password: hashedPassword, name: 'Laura', lastName: 'Recepcionista', owner: peluqueriaAdmin, roles: [secretariaRole] });

    // -- Cuenta "Clínica Visión" --
    const oftalmologiaAdmin = await this.userRepo.save({ email: 'oftalmologia@vision.com', password: hashedPassword, name: 'Admin', lastName: 'Visión', isAdmin: true, roles: [adminRole] });
    await this.subscriptionRepo.save({ user: oftalmologiaAdmin, subscriptionPlan: professionalPlan, status: 'active', startDate: new Date(), endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)) });
    const medicoOftalmologo = await this.userRepo.save({ email: 'medico@vision.com', password: hashedPassword, name: 'Dr.', lastName: 'Arias', owner: oftalmologiaAdmin, roles: [profesionalRole] });

    // 5. CREAR CONFIGURACIÓN DE AGENDA
    this.logger.log('🌱 Creando configuración de agenda...');
    await this.agendaConfigRepo.save({ user: estilistaUno, startTime: '09:00', endTime: '18:00', slotDuration: 45, workingDays: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] });
    await this.agendaConfigRepo.save({ user: medicoOftalmologo, startTime: '08:00', endTime: '16:00', slotDuration: 20, workingDays: ['Monday', 'Wednesday', 'Friday'] });
    
    // 6. CREAR SERVICIOS Y SALAS
    this.logger.log('🌱 Creando servicios y salas...');
    
    // Servicios para Peluquería
    const servicioCorte = await this.serviceRepo.save({ name: 'Corte de Cabello', description: 'Corte personalizado', price: 25.00, duration: 30, owner: peluqueriaAdmin });
    const servicioTinte = await this.serviceRepo.save({ name: 'Tinte Completo', description: 'Cambio de color profesional', price: 60.00, duration: 90, owner: peluqueriaAdmin });
    const servicioPeinado = await this.serviceRepo.save({ name: 'Peinado', description: 'Peinado para eventos', price: 35.00, duration: 45, owner: peluqueriaAdmin });
    const servicioTratamiento = await this.serviceRepo.save({ name: 'Tratamiento Capilar', description: 'Tratamiento hidratante y reparador', price: 45.00, duration: 60, owner: peluqueriaAdmin });
    const servicioGenerico = await this.serviceRepo.save({ name: 'Consulta General', description: 'Servicio no especificado', price: 0.00, duration: 30, owner: peluqueriaAdmin });
    
    // Servicios para Oftalmología
    const consultaOftalmo = await this.serviceRepo.save({ name: 'Consulta Oftalmológica', description: 'Examen completo de la vista', price: 80.00, duration: 20, owner: oftalmologiaAdmin });
    const controlAnual = await this.serviceRepo.save({ name: 'Control Anual', description: 'Revisión anual preventiva', price: 60.00, duration: 15, owner: oftalmologiaAdmin });
    const seguimiento = await this.serviceRepo.save({ name: 'Seguimiento', description: 'Control post-operatorio', price: 50.00, duration: 15, owner: oftalmologiaAdmin });
    const consultaGenerica = await this.serviceRepo.save({ name: 'Consulta General', description: 'Consulta no especificada', price: 0.00, duration: 20, owner: oftalmologiaAdmin });
    
    // Salas para Peluquería
    const salonPrincipal = await this.roomRepo.save({ name: 'Salón Principal', description: 'Área principal de atención', capacity: 4, location: 'Planta baja', owner: peluqueriaAdmin });
    const salonTinte = await this.roomRepo.save({ name: 'Área de Color', description: 'Zona especializada para tintes', capacity: 2, location: 'Planta baja', owner: peluqueriaAdmin });
    const salaEspera = await this.roomRepo.save({ name: 'Área de Espera', description: 'Zona de espera y recepción', capacity: 6, location: 'Entrada', owner: peluqueriaAdmin });
    const espacioGenerico = await this.roomRepo.save({ name: 'Espacio General', description: 'Ubicación no especificada', capacity: 1, location: 'N/A', owner: peluqueriaAdmin });
    
    // Salas para Oftalmología
    const consultorio1 = await this.roomRepo.save({ name: 'Consultorio 1', description: 'Consultorio principal', capacity: 3, location: 'Primera planta', owner: oftalmologiaAdmin });
    const consultorio2 = await this.roomRepo.save({ name: 'Consultorio 2', description: 'Consultorio secundario', capacity: 2, location: 'Primera planta', owner: oftalmologiaAdmin });
    const salaExamenes = await this.roomRepo.save({ name: 'Sala de Exámenes', description: 'Equipamiento especializado', capacity: 2, location: 'Primera planta', owner: oftalmologiaAdmin });
    const consultorioGenerico = await this.roomRepo.save({ name: 'Consultorio General', description: 'Ubicación no especificada', capacity: 1, location: 'N/A', owner: oftalmologiaAdmin });

    // 7. CREAR CLIENTES Y PRODUCTOS
    this.logger.log('🌱 Creando clientes y productos...');
    const clientePeluqueria = await this.clientRepo.save({ fullname: 'Ana Torres', name: 'Ana', lastName: 'Torres', owner: peluqueriaAdmin, user: peluqueriaAdmin, status: ClientStatus.ACTIVE });
    const pacienteOftalmologia = await this.clientRepo.save({ fullname: 'Roberto Sanz', name: 'Roberto', lastName: 'Sanz', owner: oftalmologiaAdmin, user: oftalmologiaAdmin, status: ClientStatus.ACTIVE });
    const shampoo = await this.productRepo.save({ name: 'Shampoo Profesional', owner: peluqueriaAdmin, user: peluqueriaAdmin, currentPrice: 25, status: 'activo' });

    // 7. CREAR MÁS CLIENTES
    this.logger.log('🌱 Creando clientes adicionales...');
    const clientesPeluqueria = [];
    const clientesOftalmologia = [];

    // Clientes para Peluquería Glamour
    const nombresPeluqueria = [
      'María González', 'Carmen Ruiz', 'Isabel López', 'Pilar Martín', 'Dolores García',
      'Teresa Jiménez', 'Francisca Muñoz', 'Antonia Álvarez', 'Manuela Romero', 'Josefa Navarro',
      'Rosa Moreno', 'Ana Torres', 'Concepción Vázquez', 'Mercedes Ramos', 'Julia Castro',
      'Esperanza Ortega', 'Amparo Delgado', 'Remedios Morales', 'Milagros Iglesias', 'Encarnación Gil'
    ];

    for (let i = 0; i < nombresPeluqueria.length; i++) {
      const [nombre, apellido] = nombresPeluqueria[i].split(' ');
      const cliente = await this.clientRepo.save({
        fullname: nombresPeluqueria[i],
        name: nombre,
        lastName: apellido,
        email: `${nombre.toLowerCase()}${i + 1}@email.com`,
        phone: `+34 6${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
        owner: peluqueriaAdmin,
        user: peluqueriaAdmin,
        status: ClientStatus.ACTIVE
      });
      clientesPeluqueria.push(cliente);
    }

    // Clientes para Clínica Visión
    const nombresOftalmologia = [
      'Roberto Sanz', 'Carlos Fernández', 'Miguel Rodríguez', 'Antonio López', 'José García',
      'Francisco Martín', 'Manuel González', 'David Pérez', 'Daniel Sánchez', 'Pablo Romero',
      'Alejandro Moreno', 'Adrián Torres', 'Álvaro Jiménez', 'Sergio Ruiz', 'Marcos Vega',
      'Hugo Herrera', 'Diego Castro', 'Iván Ortega', 'Rubén Morales', 'Óscar Delgado'
    ];

    for (let i = 0; i < nombresOftalmologia.length; i++) {
      const [nombre, apellido] = nombresOftalmologia[i].split(' ');
      const cliente = await this.clientRepo.save({
        fullname: nombresOftalmologia[i],
        name: nombre,
        lastName: apellido,
        email: `${nombre.toLowerCase()}${i + 1}@pacientes.com`,
        phone: `+34 7${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
        owner: oftalmologiaAdmin,
        user: oftalmologiaAdmin,
        status: ClientStatus.ACTIVE
      });
      clientesOftalmologia.push(cliente);
    }

    // 8. CREAR CITAS PARA HOY CON DIFERENTES ESTADOS
    this.logger.log('🌱 Creando citas para hoy...');
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const estadosHoy = [
      AppointmentStatus.PENDING,
      AppointmentStatus.CONFIRMED,
      AppointmentStatus.CHECKED_IN,
      AppointmentStatus.IN_PROGRESS,
      AppointmentStatus.COMPLETED,
      AppointmentStatus.CANCELLED,
      AppointmentStatus.NO_SHOW
    ];

    // Arrays de servicios y salas para selección aleatoria
    const serviciosPeluqueria = [servicioCorte, servicioTinte, servicioPeinado, servicioTratamiento, servicioGenerico];
    const salasPeluqueria = [salonPrincipal, salonTinte, salaEspera, espacioGenerico];
    const serviciosOftalmologia = [consultaOftalmo, controlAnual, seguimiento, consultaGenerica];
    const salasOftalmologia = [consultorio1, consultorio2, salaExamenes, consultorioGenerico];

    // Citas para peluquería hoy (9:00 - 18:00, slots de 45 min)
    for (let i = 0; i < 8; i++) {
      const startHour = 9 + Math.floor(i * 1.125); // Distribuir a lo largo del día
      const cliente = clientesPeluqueria[i % clientesPeluqueria.length];
      const estado = estadosHoy[i % estadosHoy.length];
      const servicio = serviciosPeluqueria[Math.floor(Math.random() * serviciosPeluqueria.length)];
      const sala = salasPeluqueria[Math.floor(Math.random() * salasPeluqueria.length)];
      
      await this.appointmentRepo.save({
        title: `${cliente.name} ${cliente.lastName} - ${servicio.name}`,
        description: servicio.description,
        startDateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), startHour, 0, 0),
        endDateTime: addMinutes(new Date(today.getFullYear(), today.getMonth(), today.getDate(), startHour, 0, 0), servicio.duration || 45),
        professional: estilistaUno,
        client: cliente,
        status: estado,
        serviceId: servicio.id,
        roomId: sala.id
      });
    }

    // Citas para oftalmología hoy (8:00 - 16:00, slots de 20 min)
    for (let i = 0; i < 10; i++) {
      const startHour = 8 + Math.floor(i * 0.8); // Distribuir a lo largo del día
      const cliente = clientesOftalmologia[i % clientesOftalmologia.length];
      const estado = estadosHoy[i % estadosHoy.length];
      const servicio = serviciosOftalmologia[Math.floor(Math.random() * serviciosOftalmologia.length)];
      const sala = salasOftalmologia[Math.floor(Math.random() * salasOftalmologia.length)];
      
      await this.appointmentRepo.save({
        title: `${cliente.name} ${cliente.lastName} - ${servicio.name}`,
        description: servicio.description,
        startDateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), startHour, i % 3 * 20, 0),
        endDateTime: addMinutes(new Date(today.getFullYear(), today.getMonth(), today.getDate(), startHour, i % 3 * 20, 0), servicio.duration || 20),
        professional: medicoOftalmologo,
        client: cliente,
        status: estado,
        serviceId: servicio.id,
        roomId: sala.id
      });
    }

    // 9. CREAR CITAS PARA LA PRÓXIMA SEMANA
    this.logger.log('🌱 Creando citas para la próxima semana...');
    
    // Próximos 7 días
    for (let day = 1; day <= 7; day++) {
      const futureDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + day);
      
      // Citas peluquería (3-5 citas por día)
      const citasPeluqueriaDia = Math.floor(Math.random() * 3) + 3;
      for (let i = 0; i < citasPeluqueriaDia; i++) {
        const startHour = 9 + Math.floor(Math.random() * 8); // 9-16h
        const cliente = clientesPeluqueria[Math.floor(Math.random() * clientesPeluqueria.length)];
        const estado = Math.random() > 0.7 ? AppointmentStatus.CONFIRMED : AppointmentStatus.PENDING;
        const servicio = serviciosPeluqueria[Math.floor(Math.random() * serviciosPeluqueria.length)];
        const sala = salasPeluqueria[Math.floor(Math.random() * salasPeluqueria.length)];
        
        await this.appointmentRepo.save({
          title: `${cliente.name} ${cliente.lastName} - ${servicio.name}`,
          description: servicio.description,
          startDateTime: new Date(futureDate.getFullYear(), futureDate.getMonth(), futureDate.getDate(), startHour, Math.floor(Math.random() * 4) * 15, 0),
          endDateTime: addMinutes(new Date(futureDate.getFullYear(), futureDate.getMonth(), futureDate.getDate(), startHour, Math.floor(Math.random() * 4) * 15, 0), servicio.duration || 45),
          professional: estilistaUno,
          client: cliente,
          status: estado,
          serviceId: servicio.id,
          roomId: sala.id
        });
      }

      // Citas oftalmología (4-8 citas por día)
      const citasOftalmologiaDia = Math.floor(Math.random() * 5) + 4;
      for (let i = 0; i < citasOftalmologiaDia; i++) {
        const startHour = 8 + Math.floor(Math.random() * 7); // 8-14h
        const cliente = clientesOftalmologia[Math.floor(Math.random() * clientesOftalmologia.length)];
        const estado = Math.random() > 0.8 ? AppointmentStatus.CONFIRMED : AppointmentStatus.PENDING;
        const servicio = serviciosOftalmologia[Math.floor(Math.random() * serviciosOftalmologia.length)];
        const sala = salasOftalmologia[Math.floor(Math.random() * salasOftalmologia.length)];
        
        await this.appointmentRepo.save({
          title: `${cliente.name} ${cliente.lastName} - ${servicio.name}`,
          description: servicio.description,
          startDateTime: new Date(futureDate.getFullYear(), futureDate.getMonth(), futureDate.getDate(), startHour, Math.floor(Math.random() * 3) * 20, 0),
          endDateTime: addMinutes(new Date(futureDate.getFullYear(), futureDate.getMonth(), futureDate.getDate(), startHour, Math.floor(Math.random() * 3) * 20, 0), servicio.duration || 20),
          professional: medicoOftalmologo,
          client: cliente,
          status: estado,
          serviceId: servicio.id,
          roomId: sala.id
        });
      }
    }

    // 10. CREAR CONSULTAS MÉDICAS
    this.logger.log('🌱 Creando consultas médicas...');
    
    // Consultas para Peluquería (consultorías de belleza/tratamientos)
    for (let i = 0; i < 10; i++) {
      const cliente = clientesPeluqueria[Math.floor(Math.random() * clientesPeluqueria.length)];
      const daysAgo = Math.floor(Math.random() * 30); // Últimos 30 días
      const consultDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysAgo);
      
      const symptoms = [
        'Cabello seco y quebradizo',
        'Caspa persistente',
        'Pérdida de brillo natural',
        'Raíces grasas y puntas secas',
        'Sensibilidad en cuero cabelludo'
      ];
      
      const diagnoses = [
        'Deshidratación capilar severa',
        'Dermatitis seborreica leve',
        'Daño por químicos',
        'Cabello mixto desequilibrado',
        'Cuero cabelludo sensible'
      ];
      
      const treatments = [
        'Tratamiento hidratante intensivo semanal',
        'Champú medicado y acondicionador específico',
        'Mascarilla reparadora quincenal',
        'Equilibrio con productos libres de sulfatos',
        'Productos hipoalergénicos y masajes suaves'
      ];

      await this.consultationRepo.save({
        clientId: cliente.id,
        userId: peluqueriaAdmin.id,
        status: ['completed', 'in_progress', 'pending'][Math.floor(Math.random() * 3)] as any,
        consultationNumber: `CONS-${Date.now()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
        startTime: new Date(consultDate.getFullYear(), consultDate.getMonth(), consultDate.getDate(), 10 + i % 6, 0, 0),
        endTime: new Date(consultDate.getFullYear(), consultDate.getMonth(), consultDate.getDate(), 10 + i % 6, 45, 0),
        symptoms: symptoms[i % symptoms.length],
        diagnosis: diagnoses[i % diagnoses.length],
        treatment: treatments[i % treatments.length],
        notes: `Consultoría especializada para ${cliente.name}. Evaluación completa del estado capilar.`,
        recommendations: 'Seguir rutina recomendada por 4 semanas, control en 2 semanas.',
        followUpRequired: Math.random() > 0.5,
        followUpDate: Math.random() > 0.5 ? new Date(consultDate.getTime() + 14 * 24 * 60 * 60 * 1000) : null,
        createdAt: consultDate,
        updatedAt: consultDate
      });
    }

    // Consultas para Oftalmología (consultas médicas reales)
    for (let i = 0; i < 15; i++) {
      const cliente = clientesOftalmologia[Math.floor(Math.random() * clientesOftalmologia.length)];
      const daysAgo = Math.floor(Math.random() * 60); // Últimos 60 días
      const consultDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysAgo);
      
      const symptoms = [
        'Visión borrosa en distancias largas',
        'Dolor ocular y enrojecimiento',
        'Dificultad para ver de noche',
        'Sensación de cuerpo extraño en el ojo',
        'Lagrimeo excesivo y picazón',
        'Manchas flotantes en la visión',
        'Sensibilidad a la luz intensa',
        'Sequedad ocular persistente'
      ];
      
      const diagnoses = [
        'Miopía leve a moderada',
        'Conjuntivitis alérgica',
        'Hipermetropía con astigmatismo',
        'Blefaritis crónica',
        'Síndrome del ojo seco',
        'Cuerpos flotantes vítreos',
        'Fotofobia funcional',
        'Queratoconjuntivitis seca'
      ];
      
      const treatments = [
        'Prescripción de lentes correctivos -2.50',
        'Antihistamínicos tópicos y compresas frías',
        'Lentes progresivos y ejercicios visuales',
        'Higiene palpebral y lágrimas artificiales',
        'Lágrimas artificiales sin conservantes',
        'Control periódico, no requiere tratamiento',
        'Gafas con filtro UV y descansos visuales',
        'Lubricantes oculares y omega-3'
      ];

      // Valores vitales realistas para consulta oftalmológica
      const vitals = {
        agudezaVisualOD: `${(Math.random() * 0.4 + 0.6).toFixed(1)}`,
        agudezaVisualOI: `${(Math.random() * 0.4 + 0.6).toFixed(1)}`,
        presionIntraocular: `${Math.floor(Math.random() * 8) + 12} mmHg`,
        campimetria: Math.random() > 0.8 ? 'Defecto localizado' : 'Normal'
      };

      await this.consultationRepo.save({
        clientId: cliente.id,
        userId: oftalmologiaAdmin.id,
        status: ['completed', 'in_progress', 'pending'][Math.floor(Math.random() * 3)] as any,
        consultationNumber: `CONS-${Date.now()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
        startTime: new Date(consultDate.getFullYear(), consultDate.getMonth(), consultDate.getDate(), 8 + i % 8, (i % 3) * 20, 0),
        endTime: new Date(consultDate.getFullYear(), consultDate.getMonth(), consultDate.getDate(), 8 + i % 8, (i % 3) * 20 + 20, 0),
        symptoms: symptoms[i % symptoms.length],
        diagnosis: diagnoses[i % diagnoses.length],
        treatment: treatments[i % treatments.length],
        notes: `Examen oftalmológico completo. Paciente refiere ${symptoms[i % symptoms.length].toLowerCase()}.`,
        recommendations: 'Control en 6 meses. Usar protección solar. Descansos visuales cada 20 minutos.',
        vitals: vitals,
        followUpRequired: Math.random() > 0.3,
        followUpDate: Math.random() > 0.3 ? new Date(consultDate.getTime() + (Math.floor(Math.random() * 180) + 30) * 24 * 60 * 60 * 1000) : null,
        createdAt: consultDate,
        updatedAt: consultDate
      });
    }

    // 11. CREAR FACTURAS
    this.logger.log('🌱 Creando facturas...');
    
    // Obtener algunas consultas creadas para vincular facturas
    const consultasPeluqueria = await this.consultationRepo.find({ 
      where: { userId: peluqueriaAdmin.id },
      take: 8
    });
    
    const consultasOftalmologia = await this.consultationRepo.find({ 
      where: { userId: oftalmologiaAdmin.id },
      take: 10
    });

    // Facturas para Peluquería
    for (let i = 0; i < Math.min(8, consultasPeluqueria.length); i++) {
      const consulta = consultasPeluqueria[i];
      const cliente = await this.clientRepo.findOne({ where: { id: consulta.clientId } });
      const daysAgo = Math.floor(Math.random() * 25);
      const invoiceDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysAgo);
      
      const services = [
        { name: 'Corte de Cabello', price: 25, quantity: 1 },
        { name: 'Tratamiento Capilar', price: 45, quantity: 1 },
        { name: 'Tinte Completo', price: 60, quantity: 1 },
        { name: 'Peinado Evento', price: 35, quantity: 1 }
      ];
      
      const products = [
        { name: 'Shampoo Profesional', price: 15, quantity: 1 },
        { name: 'Acondicionador Reparador', price: 18, quantity: 1 },
        { name: 'Mascarilla Hidratante', price: 22, quantity: 2 },
        { name: 'Serum Capilar', price: 28, quantity: 1 }
      ];

      const invoice = await this.invoiceRepo.save({
        clientId: cliente.id,
        userId: peluqueriaAdmin.id,
        consultationId: consulta.id,
        invoiceNumber: `INV-${Date.now()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
        dueDate: new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000),
        status: ['pending', 'paid', 'overdue'][Math.floor(Math.random() * 3)] as any,
        subtotal: 0,
        tax: 0,
        total: 0,
        remainingAmount: 0,
        isPaid: Math.random() > 0.4,
        paymentMethod: Math.random() > 0.5 ? 'card' : 'cash',
        paymentDate: Math.random() > 0.4 ? invoiceDate : null,
        paidAmount: 0,
        createdAt: invoiceDate,
        updatedAt: invoiceDate
      });

      // Crear items de la factura
      const selectedServices = [services[i % services.length]];
      if (Math.random() > 0.5) {
        selectedServices.push(products[i % products.length]);
      }

      let subtotal = 0;
      for (const item of selectedServices) {
        const invoiceItem = await this.invoiceItemRepo.save({
          invoiceId: invoice.id,
          itemType: services.includes(item) ? 'service' : 'product',
          itemId: 1, // ID genérico
          description: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          total: item.price * item.quantity
        });
        subtotal += invoiceItem.total;
      }

      const tax = subtotal * 0.21; // IVA 21%
      const total = subtotal + tax;
      
      await this.invoiceRepo.update(invoice.id, {
        subtotal,
        tax,
        total,
        remainingAmount: invoice.isPaid ? 0 : total,
        paidAmount: invoice.isPaid ? total : 0
      });
    }

    // Facturas para Oftalmología
    for (let i = 0; i < Math.min(10, consultasOftalmologia.length); i++) {
      const consulta = consultasOftalmologia[i];
      const cliente = await this.clientRepo.findOne({ where: { id: consulta.clientId } });
      const daysAgo = Math.floor(Math.random() * 30);
      const invoiceDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysAgo);
      
      const services = [
        { name: 'Consulta Oftalmológica', price: 80, quantity: 1 },
        { name: 'Control Anual', price: 60, quantity: 1 },
        { name: 'Seguimiento Post-Operatorio', price: 50, quantity: 1 },
        { name: 'Examen de Fondo de Ojo', price: 40, quantity: 1 }
      ];
      
      const products = [
        { name: 'Lentes de Contacto', price: 45, quantity: 2 },
        { name: 'Solución de Limpieza', price: 12, quantity: 1 },
        { name: 'Gotas Lubricantes', price: 18, quantity: 1 },
        { name: 'Gafas Recetadas', price: 120, quantity: 1 }
      ];

      const invoice = await this.invoiceRepo.save({
        clientId: cliente.id,
        userId: oftalmologiaAdmin.id,
        consultationId: consulta.id,
        invoiceNumber: `INV-${Date.now()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
        dueDate: new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000),
        status: ['pending', 'paid', 'overdue'][Math.floor(Math.random() * 3)] as any,
        subtotal: 0,
        tax: 0,
        total: 0,
        remainingAmount: 0,
        isPaid: Math.random() > 0.3,
        paymentMethod: Math.random() > 0.6 ? 'card' : 'cash',
        paymentDate: Math.random() > 0.3 ? invoiceDate : null,
        paidAmount: 0,
        createdAt: invoiceDate,
        updatedAt: invoiceDate
      });

      // Crear items de la factura (consulta + posible producto)
      const selectedServices = [services[i % services.length]];
      if (Math.random() > 0.6) {
        selectedServices.push(products[i % products.length]);
      }

      let subtotal = 0;
      for (const item of selectedServices) {
        const invoiceItem = await this.invoiceItemRepo.save({
          invoiceId: invoice.id,
          itemType: services.includes(item) ? 'service' : 'product',
          itemId: 1, // ID genérico
          description: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          total: item.price * item.quantity
        });
        subtotal += invoiceItem.total;
      }

      const tax = subtotal * 0.21; // IVA 21%
      const total = subtotal + tax;
      
      await this.invoiceRepo.update(invoice.id, {
        subtotal,
        tax,
        total,
        remainingAmount: invoice.isPaid ? 0 : total,
        paidAmount: invoice.isPaid ? total : 0
      });
    }

    this.logger.log('✅ Seed con RBAC finalizado!');
    this.logger.log('--- Credenciales de Prueba ---');
    this.logger.log('Admin Peluquería: peluqueria@glamour.com / 12345678');
    this.logger.log('Estilista: estilista@glamour.com / 12345678');
    this.logger.log('Secretaria Peluquería: recepcion@glamour.com / 12345678');
    this.logger.log('Admin Oftalmología: oftalmologia@vision.com / 12345678');
    this.logger.log('Médico: medico@vision.com / 12345678');
    // Crear tipos de negocio
    await this.businessTypeSeedService.seed();
    
    // Crear sistema de recompensas
    await this.rewardsSeedService.seed();
    
    this.logger.log('--- Datos de Prueba Creados ---');
    this.logger.log('✓ 10 Consultas para Peluquería Glamour');
    this.logger.log('✓ 15 Consultas para Clínica Visión');
    this.logger.log('✓ Facturas con servicios y productos');
    this.logger.log('✓ Estados variados: pending, in_progress, completed');
    this.logger.log('✓ Tipos de negocio inicializados');
    this.logger.log('✓ Sistema de recompensas configurado');
  }
}