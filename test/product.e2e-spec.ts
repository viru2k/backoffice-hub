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

describe('Product Controller (e2e)', () => {
  let app: INestApplication;
  let agent: request.SuperTest<request.Test>;
  let adminToken: string;
  let nonAdminToken: string;
  let adminUserId: number;
  let nonAdminUserId: number;
  let manageProductsPermission: Permission;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: (context) => {
        const req = context.switchToHttp().getRequest();
        // Default mock user for setup, will be overridden per test
        req.user = { id: 1, email: 'test@example.com', isAdmin: true, roles: [{ permissions: [{ name: 'product:manage' }, { name: 'user:manage:group' }, { name: 'role:manage' }] }] };
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

    // Create permissions and roles needed for tests
    const permissionsRepository = connection.getRepository(Permission);
    manageProductsPermission = await permissionsRepository.save({ name: 'product:manage', description: 'Manage products' });
    const manageUsersPermission = await permissionsRepository.save({ name: 'user:manage:group', description: 'Manage users in group' });
    const manageRolesPermission = await permissionsRepository.save({ name: 'role:manage', description: 'Manage roles' });

    const rolesRepository = connection.getRepository(Role);
    const adminRole = await rolesRepository.save({ name: 'Admin', description: 'Account Administrator', permissions: [manageProductsPermission, manageUsersPermission, manageRolesPermission] });
    const professionalRole = await rolesRepository.save({ name: 'Professional', description: 'Professional User', permissions: [] });

    // Register and login admin user
    const adminRegisterDto = {
      fullName: 'Admin Product Test',
      email: 'admin.product@example.com',
      password: 'password123',
      phone: '111111111',
      address: 'Admin St',
      city: 'Admin City',
      country: 'Admin Country',
      zipCode: '11111',
    };
    const adminRegisterResponse = await agent.post('/auth/register').send(adminRegisterDto).expect(201);
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
      fullName: 'Non Admin Product Test',
      email: 'nonadmin.product@example.com',
      password: 'password123',
      phone: '222222222',
      address: 'Non Admin St',
      city: 'Non Admin City',
      country: 'Non Admin Country',
      zipCode: '22222',
    };
    const nonAdminRegisterResponse = await agent.post('/auth/register').send(nonAdminRegisterDto).expect(201);
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

  describe('POST /product', () => {
    it('should allow an admin to create a product', async () => {
      setMockUser(adminUserId, true, ['product:manage']);
      const createProductDto = {
        name: 'New Product Admin',
        description: 'Description for new product',
        price: 100.50,
        isActive: true,
      };

      const response = await agent
        .post('/product')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createProductDto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('New Product Admin');
      expect(response.body.price).toBe(100.50);
      expect(response.body.isActive).toBe(true);
      expect(response.body.priceHistory).toHaveLength(1);
      expect(response.body.priceHistory[0].price).toBe(100.50);
    });

    it('should not allow a non-admin to create a product', async () => {
      setMockUser(nonAdminUserId, false, []); // No product:manage permission
      const createProductDto = {
        name: 'New Product Non Admin',
        description: 'Description for non-admin product',
        price: 50.00,
        isActive: true,
      };

      await agent
        .post('/product')
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .send(createProductDto)
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('GET /product', () => {
    let createdProductId: number;

    beforeAll(async () => {
      setMockUser(adminUserId, true, ['product:manage']);
      const createProductDto = {
        name: 'List Product Test',
        description: 'Description for list product',
        price: 200.00,
        isActive: true,
      };
      const response = await agent
        .post('/product')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createProductDto)
        .expect(HttpStatus.CREATED);
      createdProductId = response.body.id;
    });

    it('should allow an admin to list products', async () => {
      setMockUser(adminUserId, true, ['product:manage']);
      const response = await agent
        .get('/product')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.some(product => product.id === createdProductId)).toBe(true);
    });

    it('should not allow a non-admin to list products', async () => {
      setMockUser(nonAdminUserId, false, []);
      await agent
        .get('/product')
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('GET /product/:id', () => {
    let createdProductId: number;
    let anotherAdminToken: string;
    let anotherAdminUserId: number;

    beforeAll(async () => {
      setMockUser(adminUserId, true, ['product:manage']);
      const createProductDto = {
        name: 'Get Product Test',
        description: 'Description for get product',
        price: 300.00,
        isActive: true,
      };
      const response = await agent
        .post('/product')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createProductDto)
        .expect(HttpStatus.CREATED);
      createdProductId = response.body.id;

      // Create another admin in a different group
      const anotherAdminRegisterDto = {
        fullName: 'Another Admin Product Test',
        email: 'another.admin.product@example.com',
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

      const connection = getConnection();
      const anotherAdminUser = await connection.getRepository(User).findOne({ where: { email: anotherAdminRegisterDto.email } });
      anotherAdminUserId = anotherAdminUser.id;
      const adminRole = await connection.getRepository(Role).findOne({ where: { name: 'Admin' } });
      anotherAdminUser.roles = [adminRole];
      await connection.getRepository(User).save(anotherAdminUser);
    });

    it('should allow an admin to get a product from their group', async () => {
      setMockUser(adminUserId, true, ['product:manage']);
      const response = await agent
        .get(`/product/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('id', createdProductId);
      expect(response.body.name).toBe('Get Product Test');
    });

    it('should not allow an admin to get a product not in their group', async () => {
      setMockUser(anotherAdminUserId, true, ['product:manage']); // Mock another admin
      await agent
        .get(`/product/${createdProductId}`)
        .set('Authorization', `Bearer ${anotherAdminToken}`)
        .expect(HttpStatus.NOT_FOUND); // Expect 404 if not in group
    });

    it('should not allow a non-admin to get a product', async () => {
      setMockUser(nonAdminUserId, false, []);
      await agent
        .get(`/product/${createdProductId}`)
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('PATCH /product/:id', () => {
    let createdProductId: number;
    let anotherAdminToken: string;
    let anotherAdminUserId: number;

    beforeAll(async () => {
      setMockUser(adminUserId, true, ['product:manage']);
      const createProductDto = {
        name: 'Update Product Test',
        description: 'Description for update product',
        price: 400.00,
        isActive: true,
      };
      const response = await agent
        .post('/product')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createProductDto)
        .expect(HttpStatus.CREATED);
      createdProductId = response.body.id;

      // Create another admin in a different group
      const anotherAdminRegisterDto = {
        fullName: 'Another Admin Update Product Test',
        email: 'another.admin.update.product@example.com',
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

      const connection = getConnection();
      const anotherAdminUser = await connection.getRepository(User).findOne({ where: { email: anotherAdminRegisterDto.email } });
      anotherAdminUserId = anotherAdminUser.id;
      const adminRole = await connection.getRepository(Role).findOne({ where: { name: 'Admin' } });
      anotherAdminUser.roles = [adminRole];
      await connection.getRepository(User).save(anotherAdminUser);
    });

    it('should allow an admin to update a product's name and isActive status', async () => {
      setMockUser(adminUserId, true, ['product:manage']);
      const updateProductDto = {
        name: 'Updated Product Name',
        isActive: false,
      };

      const response = await agent
        .patch(`/product/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateProductDto)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('name', 'Updated Product Name');
      expect(response.body).toHaveProperty('isActive', false);
    });

    it('should create a new price history entry when price is updated', async () => {
      setMockUser(adminUserId, true, ['product:manage']);
      const newPrice = 450.75;
      const updateProductDto = {
        price: newPrice,
      };

      const response = await agent
        .patch(`/product/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateProductDto)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('price', newPrice);
      expect(response.body.priceHistory).toHaveLength(2); // Original + new entry
      expect(response.body.priceHistory[1].price).toBe(newPrice);
    });

    it('should not allow an admin to update a product not in their group', async () => {
      setMockUser(anotherAdminUserId, true, ['product:manage']);
      const updateProductDto = {
        name: 'Attempted Cross Group Update',
      };

      await agent
        .patch(`/product/${createdProductId}`)
        .set('Authorization', `Bearer ${anotherAdminToken}`)
        .send(updateProductDto)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should not allow a non-admin to update a product', async () => {
      setMockUser(nonAdminUserId, false, []);
      const updateProductDto = {
        name: 'Attempted Non Admin Update',
      };

      await agent
        .patch(`/product/${createdProductId}`)
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .send(updateProductDto)
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('DELETE /product/:id', () => {
    let createdProductId: number;
    let anotherAdminToken: string;
    let anotherAdminUserId: number;

    beforeAll(async () => {
      setMockUser(adminUserId, true, ['product:manage']);
      const createProductDto = {
        name: 'Delete Product Test',
        description: 'Description for delete product',
        price: 500.00,
        isActive: true,
      };
      const response = await agent
        .post('/product')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createProductDto)
        .expect(HttpStatus.CREATED);
      createdProductId = response.body.id;

      // Create another admin in a different group
      const anotherAdminRegisterDto = {
        fullName: 'Another Admin Delete Product Test',
        email: 'another.admin.delete.product@example.com',
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

      const connection = getConnection();
      const anotherAdminUser = await connection.getRepository(User).findOne({ where: { email: anotherAdminRegisterDto.email } });
      anotherAdminUserId = anotherAdminUser.id;
      const adminRole = await connection.getRepository(Role).findOne({ where: { name: 'Admin' } });
      anotherAdminUser.roles = [adminRole];
      await connection.getRepository(User).save(anotherAdminUser);
    });

    it('should allow an admin to delete a product from their group', async () => {
      setMockUser(adminUserId, true, ['product:manage']);
      await agent
        .delete(`/product/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.NO_CONTENT); // 204 No Content for successful deletion

      // Verify it's actually deleted (or marked inactive)
      await agent
        .get(`/product/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should not allow an admin to delete a product not in their group', async () => {
      setMockUser(anotherAdminUserId, true, ['product:manage']);
      // Re-create a product for the original admin to ensure it exists for this test
      const createProductDto = {
        name: 'Temp Product for Delete Test',
        description: 'Temp product',
        price: 10.00,
        isActive: true,
      };
      const response = await agent
        .post('/product')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createProductDto)
        .expect(HttpStatus.CREATED);
      const tempProductId = response.body.id;

      await agent
        .delete(`/product/${tempProductId}`)
        .set('Authorization', `Bearer ${anotherAdminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should not allow a non-admin to delete a product', async () => {
      setMockUser(nonAdminUserId, false, []);
      // Re-create a product for the original admin to ensure it exists for this test
      const createProductDto = {
        name: 'Temp Product for Non Admin Delete Test',
        description: 'Temp product',
        price: 20.00,
        isActive: true,
      };
      const response = await agent
        .post('/product')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createProductDto)
        .expect(HttpStatus.CREATED);
      const tempProductId = response.body.id;

      await agent
        .delete(`/product/${tempProductId}`)
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });
  });
});