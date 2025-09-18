import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client, ClientStatus } from '../client/entities/client.entity';
import { User } from '../user/entities/user.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class ClientPortalSeedService {
  private readonly logger = new Logger(ClientPortalSeedService.name);

  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async seedClientPortalData() {
    this.logger.log('🌱 Iniciando seed de datos para Portal de Clientes...');

    try {
      // Buscar el primer usuario admin para asignar como owner
      const adminUser = await this.userRepository.findOne({
        where: { isAdmin: true },
      });

      if (!adminUser) {
        this.logger.error('❌ No se encontró un usuario admin. Ejecuta primero el seed de usuarios.');
        return;
      }

      // Verificar si ya existen clientes con portal
      const existingClientsWithPortal = await this.clientRepository.find({
        where: { hasPortalAccess: true },
      });

      if (existingClientsWithPortal.length > 0) {
        this.logger.log('✅ Ya existen clientes con acceso al portal. Saltando seed...');
        return;
      }

      // Crear clientes de ejemplo con diferentes estados de portal
      const clientsToCreate = [
        {
          // Cliente 1: CON PORTAL HABILITADO - Listo para probar
          name: 'Juan Carlos',
          lastName: 'Pérez González',
          fullname: 'Juan Carlos Pérez González',
          email: 'juan.perez@email.com',
          phone: '+34 666 123 456',
          address: 'Calle Principal 123, Madrid',
          membershipNumber: 'ORB-20250104-1001',
          gender: 'male' as const,
          status: ClientStatus.ACTIVE,
          
          // PORTAL HABILITADO
          hasPortalAccess: true,
          password: await bcrypt.hash('cliente123', 10), // Contraseña: cliente123
          
          // Campos editables por el cliente
          preferredName: 'Juancho',
          personalNotes: 'Prefiero citas por la mañana. Soy alérgico a ciertos productos.',
          avatarUrl: null,
          
          // Campos administrativos
          adminNotes: 'Cliente VIP desde 2023. Muy satisfecho con nuestros servicios.',
          owner: adminUser,
          user: adminUser,
        },
        {
          // Cliente 2: CON PORTAL HABILITADO - Mujer ejemplo
          name: 'María José',
          lastName: 'García Ruiz',
          fullname: 'María José García Ruiz',
          email: 'maria.garcia@email.com',
          phone: '+34 677 234 567',
          address: 'Av. Libertad 45, Barcelona',
          membershipNumber: 'ORB-20250104-1002',
          gender: 'female' as const,
          status: ClientStatus.ACTIVE,
          
          // PORTAL HABILITADO
          hasPortalAccess: true,
          password: await bcrypt.hash('maria456', 10), // Contraseña: maria456
          
          // Campos editables por el cliente
          preferredName: 'Mari',
          personalNotes: 'Trabajo en horario nocturno, prefiero citas después de las 14:00h.',
          avatarUrl: null,
          
          // Campos administrativos
          adminNotes: 'Cliente frecuente. Le gusta probar tratamientos nuevos.',
          owner: adminUser,
          user: adminUser,
        },
        {
          // Cliente 3: SIN PORTAL - Para probar habilitación
          name: 'Roberto',
          lastName: 'Martínez López',
          fullname: 'Roberto Martínez López', 
          email: 'roberto.martinez@email.com',
          phone: '+34 688 345 678',
          address: 'Plaza Mayor 10, Valencia',
          membershipNumber: 'ORB-20250104-1003',
          gender: 'male' as const,
          status: ClientStatus.ACTIVE,
          
          // SIN PORTAL (para probar habilitación)
          hasPortalAccess: false,
          password: null,
          
          // Campos vacíos (cliente no ha personalizado)
          preferredName: null,
          personalNotes: null,
          avatarUrl: null,
          
          // Campos administrativos
          adminNotes: 'Nuevo cliente. Potencial candidato para portal.',
          owner: adminUser,
          user: adminUser,
        },
        {
          // Cliente 4: INACTIVO CON PORTAL - Para probar casos edge
          name: 'Carmen',
          lastName: 'Rodríguez Sánchez',
          fullname: 'Carmen Rodríguez Sánchez',
          email: 'carmen.rodriguez@email.com',
          phone: '+34 699 456 789',
          address: 'Calle Flores 22, Sevilla',
          membershipNumber: 'ORB-20250104-1004',
          gender: 'female' as const,
          status: ClientStatus.INACTIVE, // INACTIVO
          
          // PORTAL HABILITADO pero cliente inactivo
          hasPortalAccess: true,
          password: await bcrypt.hash('carmen789', 10), // No debería poder loguearse
          
          preferredName: 'Carmencita',
          personalNotes: 'Cliente inactiva desde octubre 2024.',
          avatarUrl: null,
          
          adminNotes: 'Cliente inactiva por mudanza. Posible reactivación futura.',
          owner: adminUser,
          user: adminUser,
        },
        {
          // Cliente 5: SIN EMAIL - Para probar validaciones
          name: 'Antonio',
          lastName: 'Jiménez Vega',
          fullname: 'Antonio Jiménez Vega',
          email: null, // SIN EMAIL - No se le puede habilitar portal
          phone: '+34 610 567 890',
          address: 'Calle Sol 15, Málaga',
          membershipNumber: 'ORB-20250104-1005',
          gender: 'male' as const,
          status: ClientStatus.ACTIVE,
          
          hasPortalAccess: false,
          password: null,
          
          preferredName: null,
          personalNotes: null,
          avatarUrl: null,
          
          adminNotes: 'Cliente sin email registrado. Contacto solo telefónico.',
          owner: adminUser,
          user: adminUser,
        },
      ];

      // Crear los clientes
      const createdClients = await this.clientRepository.save(clientsToCreate);

      this.logger.log(`✅ Creados ${createdClients.length} clientes de ejemplo para Portal:`);
      
      createdClients.forEach(client => {
        const portalStatus = client.hasPortalAccess ? '🟢 CON PORTAL' : '🔴 SIN PORTAL';
        const statusText = client.status === ClientStatus.ACTIVE ? 'ACTIVO' : 'INACTIVO';
        
        this.logger.log(`  - ${client.fullname} (${client.email || 'sin email'}) - ${portalStatus} - ${statusText}`);
      });

      this.logger.log('\n📧 CREDENCIALES DE PRUEBA PARA PORTAL:');
      this.logger.log('══════════════════════════════════════════════════');
      this.logger.log('👤 Cliente 1: juan.perez@email.com / cliente123');
      this.logger.log('👤 Cliente 2: maria.garcia@email.com / maria456');  
      this.logger.log('🚫 Cliente 3: roberto.martinez@email.com (Sin portal - usar botón "Habilitar Portal")');
      this.logger.log('⚠️  Cliente 4: carmen.rodriguez@email.com / carmen789 (INACTIVO - no debería poder loguearse)');
      this.logger.log('❌ Cliente 5: Sin email (No se puede habilitar portal)');
      this.logger.log('══════════════════════════════════════════════════\n');

      this.logger.log('🚀 Seed de Portal de Clientes completado exitosamente!');

    } catch (error) {
      this.logger.error('❌ Error durante el seed de Portal de Clientes:', error.message);
      throw error;
    }
  }
}