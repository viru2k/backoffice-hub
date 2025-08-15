import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource, Repository } from 'typeorm';
import { Permission } from './../src/permissions/entities/permission.entity';
import { Role } from './../src/roles/entities/role.entity';
import { SubscriptionPlan } from './../src/subscription-plan/entities/subscription-plan.entity';
import { Subscription } from './../src/subscription/entities/subscription.entity';
import { User } from './../src/user/entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { VALID_SERVICES } from './../src/common/constants/services';

describe('Auth Controller (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let permissionRepo: Repository<Permission>;
  let roleRepo: Repository<Role>;
  let planRepo: Repository<SubscriptionPlan>;
  let userRepo: Repository<User>;
  let subscriptionRepo: Repository<Subscription>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);
    permissionRepo = dataSource.getRepository(Permission);
    roleRepo = dataSource.getRepository(Role);
    planRepo = dataSource.getRepository(SubscriptionPlan);
    userRepo = dataSource.getRepository(User);
    subscriptionRepo = dataSource.getRepository(Subscription);

    await dataSource.synchronize(true);

    // Seed necessary data for tests
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
    await permissionRepo.save(permissionsData);
    const allPermissions = await permissionRepo.find();

    const getPerms = (...names: string[]) => allPermissions.filter(p => names.includes(p.name));
    await roleRepo.save({ name: 'Admin de Cuenta', description: 'Acceso total a la cuenta.', permissions: allPermissions });
    await roleRepo.save({ name: 'Profesional', description: 'Gestiona su agenda y clientes.', permissions: getPerms('agenda:read:own', 'agenda:write:own', 'client:manage:group', 'product:manage:group') });
    await roleRepo.save({ name: 'Secretaria', description: 'Gestiona agendas y clientes del grupo.', permissions: getPerms('agenda:read:group', 'agenda:write:group', 'client:manage:group') });

    await planRepo.save({ name: 'Starter', priceMonthly: 10, priceSemiannual: 55, priceAnnual: 100, maxUsers: 3, description: 'Plan para empezar' });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user and return a token', async () => {
      const registerDto = {
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        subscriptionType: 'monthly',
        services: [VALID_SERVICES[0], VALID_SERVICES[1]], // Using 'agenda' and 'inventory'
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(typeof response.body.token).toBe('string');
    });
  });

  describe('POST /auth/login', () => {
    beforeAll(async () => {
      // Register a user for login tests
      const registerDto = {
        fullName: 'Login Test User',
        email: 'login@example.com',
        password: 'loginpassword',
        subscriptionType: 'monthly',
        services: [VALID_SERVICES[0], VALID_SERVICES[1]],
      };
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);
    });

    it('should login with valid credentials and return a token', async () => {
      const loginDto = {
        email: 'login@example.com',
        password: 'loginpassword',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(typeof response.body.token).toBe('string');
    });

    it('should not login with invalid credentials', async () => {
      const loginDto = {
        email: 'login@example.com',
        password: 'wrongpassword',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });

    it('should not login with a non-existent user', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'anypassword',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });

    // To test inactive user, we would need to modify the user's isActive status directly in the DB,
    // which is outside the scope of a simple e2e login test without admin privileges.
    // This would typically be covered by a unit test for AuthService or an e2e test with admin capabilities.
  });

  describe('GET /auth/profile', () => {
    let authToken: string;

    beforeAll(async () => {
      // Register and login a user to get a token
      const registerDto = {
        fullName: 'Profile Test User',
        email: 'profile@example.com',
        password: 'profilepassword',
        subscriptionType: 'monthly',
        services: [VALID_SERVICES[0], VALID_SERVICES[1]],
      };
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      const loginDto = {
        email: 'profile@example.com',
        password: 'profilepassword',
      };
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(201);

      authToken = loginResponse.body.token;
    });

    it("should return the authenticated user's profile", async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', 'profile@example.com');
      expect(response.body).toHaveProperty('fullName', 'Profile Test User');
      expect(response.body).toHaveProperty('roles');
      expect(Array.isArray(response.body.roles)).toBe(true);
      expect(response.body).toHaveProperty('permissions');
      expect(typeof response.body.permissions).toBe('object');
      expect(response.body).toHaveProperty('canManageUsers');
      expect(typeof response.body.canManageUsers).toBe('boolean');
    });

    it('should not return profile without a token', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });

    it('should not return profile with an invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer invalidtoken`)
        .expect(401);
    });
  });
});