import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from './../src/common/guards/permissions.guard';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { User } from './../src/user/entities/user.entity';
import { Role } from './../src/roles/entities/role.entity';
import { Permission } from './../src/permissions/entities/permission.entity';
import { Client } from './../src/client/entities/client.entity';
import * as dotenv from 'dotenv';

dotenv.config();

describe('Client Controller (e2e)', () => {
  let app: INestApplication;
  let agent: any;
  let adminToken: string;
  let nonAdminToken: string;
  let adminUserId: number;
  let nonAdminUserId: number;
  let manageClientsPermission: Permission;

  const mockAuthGuard = { canActivate: jest.fn() };
  const mockPermissionsGuard = { canActivate: jest.fn(() => true) };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [User, Role, Permission, Client], // Add all entities used in this test suite
          synchronize: true,
          logging: false,
        }),
        AppModule,
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(mockAuthGuard)
      .overrideGuard(PermissionsGuard)
      .useValue(mockPermissionsGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    agent = request(app.getHttpServer());

    // Create permissions and roles needed for tests
    const permissionsRepository = app.get(getRepositoryToken(Permission));
    manageClientsPermission = await permissionsRepository.save({ name: 'client:manage', description: 'Manage clients' });
    const manageUsersPermission = await permissionsRepository.save({ name: 'user:manage:group', description: 'Manage users in group' });
    const manageRolesPermission = await permissionsRepository.save({ name: 'role:manage', description: 'Manage roles' });

    const rolesRepository = app.get(getRepositoryToken(Role));
    const adminRole = await rolesRepository.save({ name: 'Admin', description: 'Account Administrator', permissions: [manageClientsPermission, manageUsersPermission, manageRolesPermission] });
    const professionalRole = await rolesRepository.save({ name: 'Professional', description: 'Professional User', permissions: [] });

    // Register and login admin user
    const adminRegisterDto = {
      fullName: 'Admin Client Test',
      email: 'admin.client@example.com',
      password: 'password123',
      phone: '111111111',
      address: 'Admin St',
      city: 'Admin City',
      country: 'Admin Country',
      zipCode: '11111',
    };
    const adminRegisterResponse = await agent.post('/auth/register').send(adminRegisterDto).expect(HttpStatus.CREATED);
    const adminLoginResponse = await agent.post('/auth/login').send({ email: adminRegisterDto.email, password: adminRegisterDto.password }).expect(HttpStatus.OK);
    adminToken = adminLoginResponse.body.token;

    const userRepository = app.get(getRepositoryToken(User));
    const adminUser = await userRepository.findOne({ where: { email: adminRegisterDto.email } });
    adminUserId = adminUser.id;
    // Assign admin role to the registered admin user
    adminUser.roles = [adminRole];
    await userRepository.save(adminUser);

    // Register and login non-admin user
    const nonAdminRegisterDto = {
      fullName: 'Non Admin Client Test',
      email: 'nonadmin.client@example.com',
      password: 'password123',
      phone: '222222222',
      address: 'Non Admin St',
      city: 'Non Admin City',
      country: 'Non Admin Country',
      zipCode: '22222',
    };
    const nonAdminRegisterResponse = await agent.post('/auth/register').send(nonAdminRegisterDto).expect(HttpStatus.CREATED);
    const nonAdminLoginResponse = await agent.post('/auth/login').send({ email: nonAdminRegisterDto.email, password: nonAdminRegisterDto.password }).expect(HttpStatus.OK);
    nonAdminToken = nonAdminLoginResponse.body.token;

    const nonAdminUser = await userRepository.findOne({ where: { email: nonAdminRegisterDto.email } });
    nonAdminUserId = nonAdminUser.id;
    // Assign professional role to the registered non-admin user
    nonAdminUser.roles = [professionalRole];
    await userRepository.save(nonAdminUser);
  });

  afterAll(async () => {
    await app.close();
  });

  // Helper to set mock user for specific tests
  const setMockUser = (userId: number, isAdmin: boolean, permissions: string[]) => {
    mockAuthGuard.canActivate.mockImplementation((context) => {
      const req = context.switchToHttp().getRequest();
      req.user = {
        id: userId,
        email: isAdmin ? 'admin.mock@example.com' : 'nonadmin.mock@example.com',
        isAdmin: isAdmin,
        roles: [{ permissions: permissions.map(p => ({ name: p })) }],
        groupId: 1, // Assuming all test users are in the same group for simplicity
      };
      return true;
    });
  };

  describe('POST /client', () => {
    it('should allow an admin to create a client', async () => {
      setMockUser(adminUserId, true, ['client:manage']);
      const createClientDto = {
        fullName: 'New Client Admin',
        email: 'new.client.admin@example.com',
        phone: '333333333',
        address: 'Client Admin St',
        city: 'Client Admin City',
        country: 'Client Admin Country',
        zipCode: '33333',
      };

      const response = await agent
        .post('/client')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createClientDto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
      expect(response.body.fullName).toBe('New Client Admin');
    });

    it('should not allow a non-admin to create a client', async () => {
      setMockUser(nonAdminUserId, false, []); // No client:manage permission
      const createClientDto = {
        fullName: 'New Client Non Admin',
        email: 'new.client.nonadmin@example.com',
        phone: '444444444',
        address: 'Client Non Admin St',
        city: 'Client Non Admin City',
        country: 'Client Non Admin Country',
        zipCode: '44444',
      };

      await agent
        .post('/client')
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .send(createClientDto)
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('GET /client', () => {
    let createdClientId: number;

    beforeAll(async () => {
      setMockUser(adminUserId, true, ['client:manage']);
      const createClientDto = {
        fullName: 'List Client Test',
        email: 'list.client@example.com',
        phone: '555555555',
        address: 'List Client St',
        city: 'List Client City',
        country: 'List Client Country',
        zipCode: '55555',
      };
      const response = await agent
        .post('/client')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createClientDto)
        .expect(HttpStatus.CREATED);
      createdClientId = response.body.id;
    });

    it('should allow an admin to list clients', async () => {
      setMockUser(adminUserId, true, ['client:manage']);
      const response = await agent
        .get('/client')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.some(client => client.id === createdClientId)).toBe(true);
    });

    it('should not allow a non-admin to list clients', async () => {
      setMockUser(nonAdminUserId, false, []);
      await agent
        .get('/client')
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('GET /client/:id', () => {
    let createdClientId: number;
    let anotherAdminToken: string;
    let anotherAdminUserId: number;

    beforeAll(async () => {
      setMockUser(adminUserId, true, ['client:manage']);
      const createClientDto = {
        fullName: 'Get Client Test',
        email: 'get.client@example.com',
        phone: '666666666',
        address: 'Get Client St',
        city: 'Get Client City',
        country: 'Get Client Country',
        zipCode: '66666',
      };
      const response = await agent
        .post('/client')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createClientDto)
        .expect(HttpStatus.CREATED);
      createdClientId = response.body.id;

      // Create another admin in a different group
      const anotherAdminRegisterDto = {
        fullName: 'Another Admin Client Test',
        email: 'another.admin.client@example.com',
        password: 'password123',
        phone: '777777777',
        address: 'Another Admin St',
        city: 'Another Admin City',
        country: 'Another Admin Country',
        zipCode: '77777',
      };
      await agent.post('/auth/register').send(anotherAdminRegisterDto).expect(201);
      const anotherAdminLoginResponse = await agent.post('/auth/login').send({ email: anotherAdminRegisterDto.email, password: anotherAdminRegisterDto.password }).expect(201);
      anotherAdminToken = anotherAdminLoginResponse.body.token;

      const anotherAdminUser = await app.get(getRepositoryToken(User)).findOne({ where: { email: anotherAdminRegisterDto.email } });
      anotherAdminUserId = anotherAdminUser.id;
      const adminRole = await app.get(getRepositoryToken(Role)).findOne({ where: { name: 'Admin' } });
      anotherAdminUser.roles = [adminRole];
      await app.get(getRepositoryToken(User)).save(anotherAdminUser);
    });

    it('should allow an admin to get a client from their group', async () => {
      setMockUser(adminUserId, true, ['client:manage']);
      const response = await agent
        .get(`/client/${createdClientId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('id', createdClientId);
      expect(response.body.fullName).toBe('Get Client Test');
    });

    it('should not allow an admin to get a client not in their group', async () => {
      setMockUser(anotherAdminUserId, true, ['client:manage']); // Mock another admin
      await agent
        .get(`/client/${createdClientId}`)
        .set('Authorization', `Bearer ${anotherAdminToken}`)
        .expect(HttpStatus.NOT_FOUND); // Expect 404 if not in group
    });

    it('should not allow a non-admin to get a client', async () => {
      setMockUser(nonAdminUserId, false, []);
      await agent
        .get(`/client/${createdClientId}`)
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('PATCH /client/:id', () => {
    let createdClientId: number;
    let anotherAdminToken: string;
    let anotherAdminUserId: number;

    beforeAll(async () => {
      setMockUser(adminUserId, true, ['client:manage']);
      const createClientDto = {
        fullName: 'Update Client Test',
        email: 'update.client@example.com',
        phone: '888888888',
        address: 'Update Client St',
        city: 'Update Client City',
        country: 'Update Client Country',
        zipCode: '88888',
      };
      const response = await agent
        .post('/client')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createClientDto)
        .expect(HttpStatus.CREATED);
      createdClientId = response.body.id;

      // Create another admin in a different group
      const anotherAdminRegisterDto = {
        fullName: 'Another Admin Update Test',
        email: 'another.admin.update@example.com',
        password: 'password123',
        phone: '999999999',
        address: 'Another Update St',
        city: 'Another Update City',
        country: 'Another Update Country',
        zipCode: '99999',
      };
      await agent.post('/auth/register').send(anotherAdminRegisterDto).expect(201);
      const anotherAdminLoginResponse = await agent.post('/auth/login').send({ email: anotherAdminRegisterDto.email, password: anotherAdminRegisterDto.password }).expect(201);
      anotherAdminToken = anotherAdminLoginResponse.body.token;

      const anotherAdminUser = await app.get(getRepositoryToken(User)).findOne({ where: { email: anotherAdminRegisterDto.email } });
      anotherAdminUserId = anotherAdminUser.id;
      const adminRole = await app.get(getRepositoryToken(Role)).findOne({ where: { name: 'Admin' } });
      anotherAdminUser.roles = [adminRole];
      await app.get(getRepositoryToken(User)).save(anotherAdminUser);
    });

    it('should allow an admin to update a client from their group', async () => {
      setMockUser(adminUserId, true, ['client:manage']);
      const updateClientDto = {
        fullName: 'Updated Client Name',
        phone: '123123123',
      };

      const response = await agent
        .patch(`/client/${createdClientId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateClientDto)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('fullName', 'Updated Client Name');
      expect(response.body).toHaveProperty('phone', '123123123');
    });

    it('should not allow an admin to update a client not in their group', async () => {
      setMockUser(anotherAdminUserId, true, ['client:manage']);
      const updateClientDto = {
        fullName: 'Attempted Cross Group Update',
      };

      await agent
        .patch(`/client/${createdClientId}`)
        .set('Authorization', `Bearer ${anotherAdminToken}`)
        .send(updateClientDto)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should not allow a non-admin to update a client', async () => {
      setMockUser(nonAdminUserId, false, []);
      const updateClientDto = {
        fullName: 'Attempted Non Admin Update',
      };

      await agent
        .patch(`/client/${createdClientId}`)
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .send(updateClientDto)
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('DELETE /client/:id', () => {
    let createdClientId: number;
    let anotherAdminToken: string;
    let anotherAdminUserId: number;

    beforeAll(async () => {
      setMockUser(adminUserId, true, ['client:manage']);
      const createClientDto = {
        fullName: 'Delete Client Test',
        email: 'delete.client@example.com',
        phone: '000000000',
        address: 'Delete Client St',
        city: 'Delete Client City',
        country: 'Delete Client Country',
        zipCode: '00000',
      };
      const response = await agent
        .post('/client')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createClientDto)
        .expect(HttpStatus.CREATED);
      createdClientId = response.body.id;

      // Create another admin in a different group
      const anotherAdminRegisterDto = {
        fullName: 'Another Admin Delete Test',
        email: 'another.admin.delete@example.com',
        password: 'password123',
        phone: '101010101',
        address: 'Another Delete St',
        city: 'Another Delete City',
        country: 'Another Delete Country',
        zipCode: '10101',
      };
      await agent.post('/auth/register').send(anotherAdminRegisterDto).expect(201);
      const anotherAdminLoginResponse = await agent.post('/auth/login').send({ email: anotherAdminRegisterDto.email, password: anotherAdminRegisterDto.password }).expect(201);
      anotherAdminToken = anotherAdminLoginResponse.body.token;

      const anotherAdminUser = await app.get(getRepositoryToken(User)).findOne({ where: { email: anotherAdminRegisterDto.email } });
      anotherAdminUserId = anotherAdminUser.id;
      const adminRole = await app.get(getRepositoryToken(Role)).findOne({ where: { name: 'Admin' } });
      anotherAdminUser.roles = [adminRole];
      await app.get(getRepositoryToken(User)).save(anotherAdminUser);
    });

    it('should allow an admin to delete a client from their group', async () => {
      setMockUser(adminUserId, true, ['client:manage']);
      await agent
        .delete(`/client/${createdClientId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.NO_CONTENT); // 204 No Content for successful deletion

      // Verify it's actually deleted (or marked inactive)
      await agent
        .get(`/client/${createdClientId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should not allow an admin to delete a client not in their group', async () => {
      setMockUser(anotherAdminUserId, true, ['client:manage']);
      // Re-create a client for the original admin to ensure it exists for this test
      const createClientDto = {
        fullName: 'Temp Client for Delete Test',
        email: 'temp.delete@example.com',
        phone: '112233445',
        address: 'Temp Delete St',
        city: 'Temp Delete City',
        country: 'Temp Delete Country',
        zipCode: '11223',
      };
      const response = await agent
        .post('/client')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createClientDto)
        .expect(HttpStatus.CREATED);
      const tempClientId = response.body.id;

      await agent
        .delete(`/client/${tempClientId}`)
        .set('Authorization', `Bearer ${anotherAdminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should not allow a non-admin to delete a client', async () => {
      setMockUser(nonAdminUserId, false, []);
      // Re-create a client for the original admin to ensure it exists for this test
      const createClientDto = {
        fullName: 'Temp Client for Non Admin Delete Test',
        email: 'temp.nonadmin.delete@example.com',
        phone: '554433221',
        address: 'Temp Non Admin Delete St',
        city: 'Temp Non Admin Delete City',
        country: 'Temp Non Admin Delete Country',
        zipCode: '55443',
      };
      const response = await agent
        .post('/client')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createClientDto)
        .expect(HttpStatus.CREATED);
      const tempClientId = response.body.id;

      await agent
        .delete(`/client/${tempClientId}`)
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });
  });
});