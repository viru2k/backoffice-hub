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

describe('Roles Controller (e2e)', () => {
  let app: INestApplication;
  let agent: request.SuperTest<request.Test>;
  let adminToken: string;
  let nonAdminToken: string;
  let adminUserId: number;
  let nonAdminUserId: number;
  let manageRolesPermission: Permission;
  let testPermission1: Permission;
  let testPermission2: Permission;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: (context) => {
        const req = context.switchToHttp().getRequest();
        // Default mock user for setup, will be overridden per test
        req.user = { id: 1, email: 'test@example.com', isAdmin: true, roles: [{ permissions: [{ name: 'role:manage' }, { name: 'user:manage:group' }] }] };
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
    manageRolesPermission = await permissionsRepository.save({ name: 'role:manage', description: 'Manage roles' });
    testPermission1 = await permissionsRepository.save({ name: 'test:permission1', description: 'Test Permission 1' });
    testPermission2 = await permissionsRepository.save({ name: 'test:permission2', description: 'Test Permission 2' });
    const userManagePermission = await permissionsRepository.save({ name: 'user:manage:group', description: 'Manage users in group' });

    const rolesRepository = connection.getRepository(Role);
    const adminRole = await rolesRepository.save({ name: 'Admin', description: 'Account Administrator', permissions: [manageRolesPermission, userManagePermission] });
    const professionalRole = await rolesRepository.save({ name: 'Professional', description: 'Professional User', permissions: [] });

    // Register and login admin user
    const adminRegisterDto = {
      fullName: 'Admin Role Test',
      email: 'admin.role@example.com',
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
      fullName: 'Non Admin Role Test',
      email: 'nonadmin.role@example.com',
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

  describe('POST /roles', () => {
    it('should allow an admin to create a new role without permissions', async () => {
      setMockUser(adminUserId, true, ['role:manage']);
      const createRoleDto = {
        name: 'New Role',
        description: 'A newly created role',
        permissionIds: [],
      };

      const response = await agent
        .post('/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createRoleDto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('New Role');
      expect(response.body.permissions).toHaveLength(0);
    });

    it('should allow an admin to create a new role with permissions', async () => {
      setMockUser(adminUserId, true, ['role:manage']);
      const createRoleDto = {
        name: 'Role With Permissions',
        description: 'A role with assigned permissions',
        permissionIds: [testPermission1.id, testPermission2.id],
      };

      const response = await agent
        .post('/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createRoleDto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Role With Permissions');
      expect(response.body.permissions).toHaveLength(2);
      expect(response.body.permissions.some(p => p.id === testPermission1.id)).toBe(true);
      expect(response.body.permissions.some(p => p.id === testPermission2.id)).toBe(true);
    });

    it('should return 400 if role name is duplicated', async () => {
      setMockUser(adminUserId, true, ['role:manage']);
      const createRoleDto = {
        name: 'Duplicate Role Name',
        description: 'This role will be duplicated',
        permissionIds: [],
      };

      await agent
        .post('/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createRoleDto)
        .expect(HttpStatus.CREATED);

      await agent
        .post('/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createRoleDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should not allow a non-admin to create a role', async () => {
      setMockUser(nonAdminUserId, false, []); // No role:manage permission
      const createRoleDto = {
        name: 'Unauthorized Role',
        description: 'Attempted by non-admin',
        permissionIds: [],
      };

      await agent
        .post('/roles')
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .send(createRoleDto)
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('GET /roles', () => {
    let createdRoleId: number;

    beforeAll(async () => {
      setMockUser(adminUserId, true, ['role:manage']);
      const createRoleDto = {
        name: 'Role For Listing',
        description: 'A role to be listed',
        permissionIds: [],
      };
      const response = await agent
        .post('/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createRoleDto)
        .expect(HttpStatus.CREATED);
      createdRoleId = response.body.id;
    });

    it('should allow an admin to list all roles', async () => {
      setMockUser(adminUserId, true, ['role:manage']);
      const response = await agent
        .get('/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.some(role => role.id === createdRoleId)).toBe(true);
      expect(response.body.some(role => role.name === 'Admin')).toBe(true); // Seeded role
    });

    it('should not allow a non-admin to list roles', async () => {
      setMockUser(nonAdminUserId, false, []);
      await agent
        .get('/roles')
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('GET /roles/:id', () => {
    let createdRoleId: number;

    beforeAll(async () => {
      setMockUser(adminUserId, true, ['role:manage']);
      const createRoleDto = {
        name: 'Role For Get By ID',
        description: 'A role to be retrieved by ID',
        permissionIds: [testPermission1.id],
      };
      const response = await agent
        .post('/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createRoleDto)
        .expect(HttpStatus.CREATED);
      createdRoleId = response.body.id;
    });

    it('should allow an admin to get a role by ID', async () => {
      setMockUser(adminUserId, true, ['role:manage']);
      const response = await agent
        .get(`/roles/${createdRoleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('id', createdRoleId);
      expect(response.body.name).toBe('Role For Get By ID');
      expect(response.body.permissions).toHaveLength(1);
      expect(response.body.permissions[0].id).toBe(testPermission1.id);
    });

    it('should return 404 if role is not found', async () => {
      setMockUser(adminUserId, true, ['role:manage']);
      const nonExistentRoleId = 99999;
      await agent
        .get(`/roles/${nonExistentRoleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should not allow a non-admin to get a role by ID', async () => {
      setMockUser(nonAdminUserId, false, []);
      await agent
        .get(`/roles/${createdRoleId}`)
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('PATCH /roles/:id', () => {
    let createdRoleId: number;

    beforeEach(async () => {
      // Create a fresh role for each update test to ensure isolation
      setMockUser(adminUserId, true, ['role:manage']);
      const createRoleDto = {
        name: `Role To Update ${Date.now()}`,
        description: 'A role to be updated',
        permissionIds: [testPermission1.id],
      };
      const response = await agent
        .post('/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createRoleDto)
        .expect(HttpStatus.CREATED);
      createdRoleId = response.body.id;
    });

    it('should allow an admin to update a role's name and description', async () => {
      setMockUser(adminUserId, true, ['role:manage']);
      const updateRoleDto = {
        name: 'Updated Role Name',
        description: 'Updated description',
      };

      const response = await agent
        .patch(`/roles/${createdRoleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateRoleDto)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('name', 'Updated Role Name');
      expect(response.body).toHaveProperty('description', 'Updated description');
      expect(response.body.permissions.some(p => p.id === testPermission1.id)).toBe(true); // Permissions should remain
    });

    it('should allow an admin to add permissions to a role', async () => {
      setMockUser(adminUserId, true, ['role:manage']);
      const updateRoleDto = {
        permissionIds: [testPermission1.id, testPermission2.id],
      };

      const response = await agent
        .patch(`/roles/${createdRoleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateRoleDto)
        .expect(HttpStatus.OK);

      expect(response.body.permissions).toHaveLength(2);
      expect(response.body.permissions.some(p => p.id === testPermission1.id)).toBe(true);
      expect(response.body.permissions.some(p => p.id === testPermission2.id)).toBe(true);
    });

    it('should allow an admin to remove permissions from a role', async () => {
      // First, ensure the role has both permissions
      setMockUser(adminUserId, true, ['role:manage']);
      await agent
        .patch(`/roles/${createdRoleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissionIds: [testPermission1.id, testPermission2.id] })
        .expect(HttpStatus.OK);

      // Then, remove one permission
      const updateRoleDto = {
        permissionIds: [testPermission1.id],
      };

      const response = await agent
        .patch(`/roles/${createdRoleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateRoleDto)
        .expect(HttpStatus.OK);

      expect(response.body.permissions).toHaveLength(1);
      expect(response.body.permissions.some(p => p.id === testPermission1.id)).toBe(true);
      expect(response.body.permissions.some(p => p.id === testPermission2.id)).toBe(false);
    });

    it('should return 404 if role to update is not found', async () => {
      setMockUser(adminUserId, true, ['role:manage']);
      const nonExistentRoleId = 99999;
      const updateRoleDto = { name: 'Non Existent Role' };

      await agent
        .patch(`/roles/${nonExistentRoleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateRoleDto)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should not allow a non-admin to update a role', async () => {
      setMockUser(nonAdminUserId, false, []);
      const updateRoleDto = { name: 'Unauthorized Update' };

      await agent
        .patch(`/roles/${createdRoleId}`)
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .send(updateRoleDto)
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('DELETE /roles/:id', () => {
    let createdRoleId: number;

    beforeEach(async () => {
      // Create a fresh role for each delete test
      setMockUser(adminUserId, true, ['role:manage']);
      const createRoleDto = {
        name: `Role To Delete ${Date.now()}`,
        description: 'A role to be deleted',
        permissionIds: [],
      };
      const response = await agent
        .post('/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createRoleDto)
        .expect(HttpStatus.CREATED);
      createdRoleId = response.body.id;
    });

    it('should allow an admin to delete a role', async () => {
      setMockUser(adminUserId, true, ['role:manage']);
      await agent
        .delete(`/roles/${createdRoleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.NO_CONTENT); // 204 No Content for successful deletion

      // Verify it's actually deleted
      await agent
        .get(`/roles/${createdRoleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 404 if role to delete is not found', async () => {
      setMockUser(adminUserId, true, ['role:manage']);
      const nonExistentRoleId = 99999;
      await agent
        .delete(`/roles/${nonExistentRoleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should not allow a non-admin to delete a role', async () => {
      setMockUser(nonAdminUserId, false, []);
      await agent
        .delete(`/roles/${createdRoleId}`)
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });
  });
});