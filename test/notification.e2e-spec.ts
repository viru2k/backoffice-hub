import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from './../src/common/guards/permissions.guard';
import { getConnection } from 'typeorm';
import { User } from './../src/user/entities/user.entity';
import { Role } from './../src/roles/entities/role.entity';
import { Permission } from './../src/permissions/entities/permission.entity';

describe('Notification Controller (e2e)', () => {
  let app: INestApplication;
  let agent: request.SuperTest<request.Test>;
  let adminToken: string;
  let nonAdminToken: string;
  let adminUserId: number;
  let nonAdminUserId: number;
  let readNotificationsPermission: Permission;
  let createNotificationsPermission: Permission;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: (context) => {
        const req = context.switchToHttp().getRequest();
        // Default mock user for setup, will be overridden per test
        req.user = { id: 1, email: 'test@example.com', isAdmin: true, roles: [{ permissions: [{ name: 'notification:read:own' }, { name: 'notification:create' }, { name: 'user:manage:group' }, { name: 'role:manage' }] }] };
        return true;
      }})
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    agent = request(app.getHttpServer());

    const connection = getConnection();
    await connection.synchronize(true); // Clear and re-sync DB

    // Create permissions needed for tests
    const permissionsRepository = connection.getRepository(Permission);
    readNotificationsPermission = await permissionsRepository.save({ name: 'notification:read:own', description: 'Read own notifications' });
    createNotificationsPermission = await permissionsRepository.save({ name: 'notification:create', description: 'Create notifications' });
    const userManagePermission = await permissionsRepository.save({ name: 'user:manage:group', description: 'Manage users in group' });
    const manageRolesPermission = await permissionsRepository.save({ name: 'role:manage', description: 'Manage roles' });

    const rolesRepository = connection.getRepository(Role);
    const adminRole = await rolesRepository.save({ name: 'Admin', description: 'Account Administrator', permissions: [readNotificationsPermission, createNotificationsPermission, userManagePermission, manageRolesPermission] });
    const professionalRole = await rolesRepository.save({ name: 'Professional', description: 'Professional User', permissions: [readNotificationsPermission] });

    // Register and login admin user
    const adminRegisterDto = {
      fullName: 'Admin Notification Test',
      email: 'admin.notification@example.com',
      password: 'password123',
      phone: '111111111',
      address: 'Admin St',
      city: 'Admin City',
      country: 'Admin Country',
      zipCode: '11111',
    };
    await agent.post('/auth/register').send(adminRegisterDto).expect(201);
    const adminLoginResponse = await agent.post('/auth/login').send({ email: adminRegisterDto.email, password: adminRegisterDto.password }).expect(201);
    adminToken = adminLoginResponse.body.token;

    const userRepository = connection.getRepository(User);
    const adminUser = await userRepository.findOne({ where: { email: adminRegisterDto.email } });
    adminUserId = adminUser.id;
    // Assign admin role to the registered admin user
    adminUser.roles = [adminRole];
    await userRepository.save(adminUser);

    // Register and login non-admin user
    const nonAdminRegisterDto = {
      fullName: 'Non Admin Notification Test',
      email: 'nonadmin.notification@example.com',
      password: 'password123',
      phone: '222222222',
      address: 'Non Admin St',
      city: 'Non Admin City',
      country: 'Non Admin Country',
      zipCode: '22222',
    };
    await agent.post('/auth/register').send(nonAdminRegisterDto).expect(201);
    const nonAdminLoginResponse = await agent.post('/auth/login').send({ email: nonAdminRegisterDto.email, password: nonAdminRegisterDto.password }).expect(201);
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

  describe('POST /notification', () => {
    it('should allow an admin to create a notification', async () => {
      setMockUser(adminUserId, true, ['notification:create']);
      const createNotificationDto = {
        userId: adminUserId, // Notification for self
        title: 'Test Notification',
        message: 'This is a test notification.',
        read: false,
      };

      const response = await agent
        .post('/notification')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createNotificationDto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Test Notification');
      expect(response.body.userId).toBe(adminUserId);
    });

    it('should not allow a non-admin to create a notification', async () => {
      setMockUser(nonAdminUserId, false, []); // No notification:create permission
      const createNotificationDto = {
        userId: nonAdminUserId,
        title: 'Unauthorized Notification',
        message: 'This should fail.',
        read: false,
      };

      await agent
        .post('/notification')
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .send(createNotificationDto)
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('GET /notification', () => {
    let createdNotificationId: number;

    beforeAll(async () => {
      setMockUser(adminUserId, true, ['notification:create', 'notification:read:own']);
      const createNotificationDto = {
        userId: adminUserId,
        title: 'Notification For Listing',
        message: 'This notification will be listed.',
        read: false,
      };
      const response = await agent
        .post('/notification')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createNotificationDto)
        .expect(HttpStatus.CREATED);
      createdNotificationId = response.body.id;
    });

    it('should allow a user to list their own notifications', async () => {
      setMockUser(adminUserId, true, ['notification:read:own']);
      const response = await agent
        .get('/notification')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.some(n => n.id === createdNotificationId)).toBe(true);
    });

    it('should not allow a user without permission to list notifications', async () => {
      setMockUser(nonAdminUserId, false, []); // No notification:read:own permission
      await agent
        .get('/notification')
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });
  });
});
