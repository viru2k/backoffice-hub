import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { getConnection } from 'typeorm';

describe('User Controller (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Clear the database before all tests
    const connection = getConnection();
    await connection.synchronize(true); // This will drop and recreate the schema

    // Register and login a user to get a token for /me test
    const registerDto = {
      fullName: 'User Me Test',
      email: 'user.me@example.com',
      password: 'password123',
      phone: '123123123',
      address: '123 Me St',
      city: 'Me City',
      country: 'Me Country',
      zipCode: '12345',
    };
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(registerDto)
      .expect(201);

    const loginDto = {
      email: 'user.me@example.com',
      password: 'password123',
    };
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send(loginDto)
      .expect(201);

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /user/me', () => {
    it('should return the profile of the authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/user/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', 'user.me@example.com');
      expect(response.body).toHaveProperty('fullName', 'User Me Test');
    });

    it('should not return profile without a token', async () => {
      await request(app.getHttpServer())
        .get('/user/me')
        .expect(401);
    });

    it('should not return profile with an invalid token', async () => {
      await request(app.getHttpServer())
        .get('/user/me')
        .set('Authorization', `Bearer invalidtoken`)
        .expect(401);
    });
  });

  describe('POST /user/sub-user', () => {
    let adminToken: string;
    let nonAdminToken: string;

    beforeAll(async () => {
      // Register an admin user
      const adminRegisterDto = {
        fullName: 'Admin User',
        email: 'admin.user@example.com',
        password: 'adminpassword',
        phone: '111111111',
        address: 'Admin St',
        city: 'Admin City',
        country: 'Admin Country',
        zipCode: '11111',
      };
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(adminRegisterDto)
        .expect(201);

      const adminLoginDto = {
        email: 'admin.user@example.com',
        password: 'adminpassword',
      };
      const adminLoginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(adminLoginDto)
        .expect(201);
      adminToken = adminLoginResponse.body.token;

      // Register a non-admin user
      const nonAdminRegisterDto = {
        fullName: 'Non Admin User',
        email: 'nonadmin.user@example.com',
        password: 'nonadminpassword',
        phone: '222222222',
        address: 'Non Admin St',
        city: 'Non Admin City',
        country: 'Non Admin Country',
        zipCode: '22222',
      };
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(nonAdminRegisterDto)
        .expect(201);

      const nonAdminLoginDto = {
        email: 'nonadmin.user@example.com',
        password: 'nonadminpassword',
      };
      const nonAdminLoginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(nonAdminLoginDto)
        .expect(201);
      nonAdminToken = nonAdminLoginResponse.body.token;
    });

    it('should allow an admin to create a sub-user', async () => {
      const createSubUserDto = {
        fullName: 'New Sub User',
        email: 'new.subuser@example.com',
        password: 'subuserpassword',
        phone: '333333333',
        address: 'Sub User St',
        city: 'Sub User City',
        country: 'Sub User Country',
        zipCode: '33333',
        roleIds: [], // Assuming roles can be assigned later or default
      };

      const response = await request(app.getHttpServer())
        .post('/user/sub-user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createSubUserDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', 'new.subuser@example.com');
    });

    it('should not allow a non-admin to create a sub-user', async () => {
      const createSubUserDto = {
        fullName: 'Unauthorized Sub User',
        email: 'unauth.subuser@example.com',
        password: 'subuserpassword',
        phone: '444444444',
        address: 'Unauthorized St',
        city: 'Unauthorized City',
        country: 'Unauthorized Country',
        zipCode: '44444',
        roleIds: [],
      };

      await request(app.getHttpServer())
        .post('/user/sub-user')
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .send(createSubUserDto)
        .expect(403);
    });

    // TODO: Add test for exceeding plan limit. This requires dynamic manipulation of subscription plans
    // or a specific seed setup, which is more complex for a basic e2e test.
  });

  describe('POST /user/sub-user - Subscription Limit', () => {
    let adminTokenWithLimit: string;
    let adminUserWithLimitId: number;

    beforeAll(async () => {
      const connection = getConnection();
      const userRepository = connection.getRepository(User);
      const subscriptionPlanRepository = connection.getRepository(SubscriptionPlan);
      const subscriptionRepository = connection.getRepository(Subscription);
      const roleRepository = connection.getRepository(Role);

      // Create a specific admin user for this test suite
      const adminRegisterDto = {
        fullName: 'Admin Limit Test',
        email: 'admin.limit@example.com',
        password: 'password123',
        phone: '999888777',
        address: 'Limit St',
        city: 'Limit City',
        country: 'Limit Country',
        zipCode: '99999',
      };
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(adminRegisterDto)
        .expect(201);

      const adminLoginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: adminRegisterDto.email, password: adminRegisterDto.password })
        .expect(201);
      adminTokenWithLimit = adminLoginResponse.body.token;

      const adminUser = await userRepository.findOne({ where: { email: adminRegisterDto.email } });
      adminUserWithLimitId = adminUser.id;

      // Ensure admin user has the 'Admin' role with 'user:manage:group' permission
      const adminRole = await roleRepository.findOne({ where: { name: 'Admin' }, relations: ['permissions'] });
      if (!adminRole) {
        throw new Error('Admin role not found. Ensure seed is run or create it.');
      }
      const userManagePermission = await connection.getRepository(Permission).findOne({ where: { name: 'user:manage:group' } });
      if (!userManagePermission) {
        throw new Error('user:manage:group permission not found. Ensure seed is run or create it.');
      }
      if (!adminRole.permissions.some(p => p.name === 'user:manage:group')) {
        adminRole.permissions.push(userManagePermission);
        await roleRepository.save(adminRole);
      }
      adminUser.roles = [adminRole];
      await userRepository.save(adminUser);

      // Create a subscription plan with maxUsers = 1
      const limitedPlan = subscriptionPlanRepository.create({
        name: 'Limited Plan',
        description: 'Plan with 1 user limit',
        price: 10,
        maxUsers: 1,
        maxClients: 10,
        maxProducts: 10,
        maxAppointments: 10,
        isActive: true,
      });
      await subscriptionPlanRepository.save(limitedPlan);

      // Create an active subscription for the admin user with this limited plan
      const subscription = subscriptionRepository.create({
        user: adminUser,
        subscriptionPlan: limitedPlan,
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1 year from now
        status: 'active',
      });
      await subscriptionRepository.save(subscription);

      // Create one sub-user to reach the limit (admin + 1 sub-user = 2 users, but maxUsers is 1)
      // The owner itself counts as one user. So if maxUsers is 1, no sub-users can be created.
      // If maxUsers is 2, one sub-user can be created.
      // Let's set maxUsers to 2 to allow one sub-user, then try to create a second.
      limitedPlan.maxUsers = 2; // Admin + 1 sub-user
      await subscriptionPlanRepository.save(limitedPlan);

      setMockUser(adminUserWithLimitId, true, ['user:manage:group']);
      const firstSubUserDto = {
        fullName: 'First Sub User',
        email: 'first.subuser.limit@example.com',
        password: 'subuserpassword',
        phone: '123123123',
        address: 'Sub User St',
        city: 'Sub User City',
        country: 'Sub User Country',
        zipCode: '12345',
        roleIds: [],
      };
      await agent
        .post('/user/sub-user')
        .set('Authorization', `Bearer ${adminTokenWithLimit}`)
        .send(firstSubUserDto)
        .expect(201);
    });

    it('should return 400 when exceeding the subscription plan user limit', async () => {
      setMockUser(adminUserWithLimitId, true, ['user:manage:group']);
      const secondSubUserDto = {
        fullName: 'Second Sub User',
        email: 'second.subuser.limit@example.com',
        password: 'subuserpassword',
        phone: '321321321',
        address: 'Sub User St 2',
        city: 'Sub User City 2',
        country: 'Sub User Country 2',
        zipCode: '54321',
        roleIds: [],
      };

      await agent
        .post('/user/sub-user')
        .set('Authorization', `Bearer ${adminTokenWithLimit}`)
        .send(secondSubUserDto)
        .expect(HttpStatus.BAD_REQUEST)
        .expect({ statusCode: 400, message: 'Límite de 2 usuarios alcanzado para su plan de suscripción.', error: 'Bad Request' });
    });
  });

  describe('PATCH /user/sub-user/:id', () => {
    let adminToken: string;
    let subUserId: number;
    let professionalRoleId: number;
    let secretaryRoleId: number;
    let anotherAdminToken: string;
    let anotherSubUserId: number;

    beforeAll(async () => {
      // Register an admin user for this test suite
      const adminRegisterDto = {
        fullName: 'Admin Update User',
        email: 'admin.update@example.com',
        password: 'adminpassword',
        phone: '888888888',
        address: 'Update Admin St',
        city: 'Update Admin City',
        country: 'Update Admin Country',
        zipCode: '88888',
      };
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(adminRegisterDto)
        .expect(201);

      const adminLoginDto = {
        email: 'admin.update@example.com',
        password: 'adminpassword',
      };
      const adminLoginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(adminLoginDto)
        .expect(201);
      adminToken = adminLoginResponse.body.token;

      // Fetch roles
      const rolesResponse = await request(app.getHttpServer())
        .get('/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      professionalRoleId = rolesResponse.body.find(role => role.name === 'Profesional')?.id;
      secretaryRoleId = rolesResponse.body.find(role => role.name === 'Secretaria')?.id;

      // Create a sub-user under the admin's account to be updated
      const createSubUserDto = {
        fullName: 'Sub User to Update',
        email: 'subuser.update@example.com',
        password: 'subuserpassword',
        phone: '999999999',
        address: 'Update Sub User St',
        city: 'Update Sub User City',
        country: 'Update Sub User Country',
        zipCode: '99999',
        roleIds: [],
      };

      const subUserResponse = await request(app.getHttpServer())
        .post('/user/sub-user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createSubUserDto)
        .expect(201);
      subUserId = subUserResponse.body.id;

      // Register another admin user from a different group
      const anotherAdminRegisterDto = {
        fullName: 'Another Admin',
        email: 'another.admin@example.com',
        password: 'anotheradminpassword',
        phone: '101010101',
        address: 'Another Admin St',
        city: 'Another City',
        country: 'Another Country',
        zipCode: '10101',
      };
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(anotherAdminRegisterDto)
        .expect(201);

      const anotherAdminLoginDto = {
        email: 'another.admin@example.com',
        password: 'anotheradminpassword',
      };
      const anotherAdminLoginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(anotherAdminLoginDto)
        .expect(201);
      anotherAdminToken = anotherAdminLoginResponse.body.token;

      // Create a sub-user under the another admin's account
      const createAnotherSubUserDto = {
        fullName: 'Another Sub User',
        email: 'another.subuser@example.com',
        password: 'anothersubuserpassword',
        phone: '121212121',
        address: 'Another Sub User St',
        city: 'Another City',
        country: 'Another Country',
        zipCode: '12121',
        roleIds: [],
      };

      const anotherSubUserResponse = await request(app.getHttpServer())
        .post('/user/sub-user')
        .set('Authorization', `Bearer ${anotherAdminToken}`)
        .send(createAnotherSubUserDto)
        .expect(201);
      anotherSubUserId = anotherSubUserResponse.body.id;
    });

    it('should allow an admin to update a sub-user's fullName and isActive status', async () => {
      const updateDto = {
        fullName: 'Updated Sub User Name',
        isActive: false,
      };

      const response = await request(app.getHttpServer())
        .patch(`/user/sub-user/${subUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body).toHaveProperty('fullName', 'Updated Sub User Name');
      expect(response.body).toHaveProperty('isActive', false);
    });

    it('should allow an admin to assign/change roles of a sub-user', async () => {
      if (!professionalRoleId || !secretaryRoleId) {
        console.warn('Profesional or Secretaria roles not found. Skipping role assignment test.');
        return;
      }

      // Assign Professional role
      const updateDtoWithRoles = {
        roleIds: [professionalRoleId],
      };

      let response = await request(app.getHttpServer())
        .patch(`/user/sub-user/${subUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateDtoWithRoles)
        .expect(200);

      expect(response.body.roles.some(role => role.id === professionalRoleId)).toBe(true);
      expect(response.body.roles.some(role => role.id === secretaryRoleId)).toBe(false);

      // Change to Secretary role
      const updateDtoChangeRoles = {
        roleIds: [secretaryRoleId],
      };

      response = await request(app.getHttpServer())
        .patch(`/user/sub-user/${subUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateDtoChangeRoles)
        .expect(200);

      expect(response.body.roles.some(role => role.id === professionalRoleId)).toBe(false);
      expect(response.body.roles.some(role => role.id === secretaryRoleId)).toBe(true);
    });

    it('should not allow a non-admin to update a sub-user', async () => {
      const nonAdminLoginDto = {
        email: 'nonadmin.user@example.com', // Using the non-admin from POST /sub-user tests
        password: 'nonadminpassword',
      };
      const nonAdminLoginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(nonAdminLoginDto)
        .expect(201);
      const nonAdminToken = nonAdminLoginResponse.body.token;

      const updateDto = {
        fullName: 'Attempted Update',
      };

      await request(app.getHttpServer())
        .patch(`/user/sub-user/${subUserId}`)
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .send(updateDto)
        .expect(403);
    });

    it('should not allow an admin to update a sub-user not in their group', async () => {
      const updateDto = {
        fullName: 'Cross Group Update',
      };

      await request(app.getHttpServer())
        .patch(`/user/sub-user/${anotherSubUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateDto)
        .expect(404); // Expect 404 Not Found if user is not in the group
    });
  });

  describe('GET /user/group', () => {
    let adminToken: string;
    let nonAdminToken: string;
    let subUserId: number;

    beforeAll(async () => {
      // Register an admin user
      const adminRegisterDto = {
        fullName: 'Admin Group User',
        email: 'admin.group@example.com',
        password: 'adminpassword',
        phone: '555555555',
        address: 'Group Admin St',
        city: 'Group Admin City',
        country: 'Group Admin Country',
        zipCode: '55555',
      };
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(adminRegisterDto)
        .expect(201);

      const adminLoginDto = {
        email: 'admin.group@example.com', // Corrected email
        password: 'adminpassword',
      };
      const adminLoginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(adminLoginDto)
        .expect(201);
      adminToken = adminLoginResponse.body.token;

      // Register a non-admin user
      const nonAdminRegisterDto = {
        fullName: 'Non Admin Group User',
        email: 'nonadmin.group@example.com',
        password: 'nonadminpassword',
        phone: '666666666',
        address: 'Group Non Admin St',
        city: 'Group Non Admin City',
        country: 'Group Non Admin Country',
        zipCode: '66666',
      };
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(nonAdminRegisterDto)
        .expect(201);

      const nonAdminLoginDto = {
        email: 'nonadmin.group@example.com',
        password: 'nonadminpassword',
      };
      const nonAdminLoginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(nonAdminLoginDto)
        .expect(201);
      nonAdminToken = nonAdminLoginResponse.body.token;

      // Create a sub-user under the admin's account
      const createSubUserDto = {
        fullName: 'Group Sub User',
        email: 'group.subuser@example.com',
        password: 'subuserpassword',
        phone: '777777777',
        address: 'Group Sub User St',
        city: 'Group Sub User City',
        country: 'Group Sub User Country',
        zipCode: '77777',
        roleIds: [],
      };

      const response = await request(app.getHttpServer())
        .post('/user/sub-user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createSubUserDto)
        .expect(201);
      subUserId = response.body.id;
    });

    it('should allow an admin to list users in their group', async () => {
      const response = await request(app.getHttpServer())
        .get('/user/group')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2); // Admin + at least one sub-user
      expect(response.body.some(user => user.email === 'admin.group@example.com')).toBe(true);
      expect(response.body.some(user => user.email === 'group.subuser@example.com')).toBe(true);
    });

    it('should not allow a non-admin to list users in their group', async () => {
      await request(app.getHttpServer())
        .get('/user/group')
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .expect(403);
    });
  });
});
