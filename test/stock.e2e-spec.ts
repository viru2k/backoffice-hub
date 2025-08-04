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
import { Product } from './../src/product/entities/product.entity';

describe('Stock Controller (e2e)', () => {
  let app: INestApplication;
  let agent: request.SuperTest<request.Test>;
  let adminToken: string;
  let nonAdminToken: string;
  let adminUserId: number;
  let nonAdminUserId: number;
  let manageStockPermission: Permission;
  let manageProductsPermission: Permission;
  let testProduct: Product;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: (context) => {
        const req = context.switchToHttp().getRequest();
        // Default mock user for setup, will be overridden per test
        req.user = { id: 1, email: 'test@example.com', isAdmin: true, roles: [{ permissions: [{ name: 'stock:manage' }, { name: 'product:manage' }, { name: 'user:manage:group' }, { name: 'role:manage' }] }] };
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
    manageStockPermission = await permissionsRepository.save({ name: 'stock:manage', description: 'Manage stock movements' });
    manageProductsPermission = await permissionsRepository.save({ name: 'product:manage', description: 'Manage products' });
    const manageUsersPermission = await permissionsRepository.save({ name: 'user:manage:group', description: 'Manage users in group' });
    const manageRolesPermission = await permissionsRepository.save({ name: 'role:manage', description: 'Manage roles' });

    const rolesRepository = connection.getRepository(Role);
    const adminRole = await rolesRepository.save({ name: 'Admin', description: 'Account Administrator', permissions: [manageStockPermission, manageProductsPermission, manageUsersPermission, manageRolesPermission] });
    const professionalRole = await rolesRepository.save({ name: 'Professional', description: 'Professional User', permissions: [] });

    // Register and login admin user
    const adminRegisterDto = {
      fullName: 'Admin Stock Test',
      email: 'admin.stock@example.com',
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
      fullName: 'Non Admin Stock Test',
      email: 'nonadmin.stock@example.com',
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

    // Create a product for stock movements
    const productRepository = connection.getRepository(Product);
    testProduct = productRepository.create({
      name: 'Test Stock Product',
      description: 'Product for stock e2e tests',
      price: 10.00,
      isActive: true,
      user: adminUser, // Associate with the admin user
    });
    await productRepository.save(testProduct);
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

  describe('POST /stock', () => {
    it('should allow an admin to create an IN stock movement', async () => {
      setMockUser(adminUserId, true, ['stock:manage']);
      const createStockMovementDto = {
        productId: testProduct.id,
        type: 'in',
        quantity: 10,
        reason: 'Initial stock',
      };

      const response = await agent
        .post('/stock')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createStockMovementDto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
      expect(response.body.productId).toBe(testProduct.id);
      expect(response.body.type).toBe('in');
      expect(response.body.quantity).toBe(10);
    });

    it('should allow an admin to create an OUT stock movement', async () => {
      setMockUser(adminUserId, true, ['stock:manage']);
      const createStockMovementDto = {
        productId: testProduct.id,
        type: 'out',
        quantity: 5,
        reason: 'Sale',
      };

      const response = await agent
        .post('/stock')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createStockMovementDto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
      expect(response.body.productId).toBe(testProduct.id);
      expect(response.body.type).toBe('out');
      expect(response.body.quantity).toBe(5);
    });

    it('should not allow a non-admin to create a stock movement', async () => {
      setMockUser(nonAdminUserId, false, []); // No stock:manage permission
      const createStockMovementDto = {
        productId: testProduct.id,
        type: 'in',
        quantity: 1,
        reason: 'Unauthorized movement',
      };

      await agent
        .post('/stock')
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .send(createStockMovementDto)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should return 404 if product is not found', async () => {
      setMockUser(adminUserId, true, ['stock:manage']);
      const nonExistentProductId = 99999;
      const createStockMovementDto = {
        productId: nonExistentProductId,
        type: 'in',
        quantity: 1,
        reason: 'Non existent product',
      };

      await agent
        .post('/stock')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createStockMovementDto)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('GET /stock/:productId/summary', () => {
    let productForSummary: Product;
    let anotherAdminToken: string;
    let anotherAdminUserId: number;

    beforeAll(async () => {
      const connection = getConnection();
      const productRepository = connection.getRepository(Product);
      const userRepository = connection.getRepository(User);
      const roleRepository = connection.getRepository(Role);
      const permissionRepository = connection.getRepository(Permission);

      // Create a product for summary tests
      productForSummary = productRepository.create({
        name: 'Summary Product',
        description: 'Product for stock summary tests',
        price: 20.00,
        isActive: true,
        user: await userRepository.findOne({ where: { id: adminUserId } }), // Associate with the main admin
      });
      await productRepository.save(productForSummary);

      // Add some initial stock movements
      setMockUser(adminUserId, true, ['stock:manage']);
      await agent
        .post('/stock')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productId: productForSummary.id,
          type: 'in',
          quantity: 50,
          reason: 'Initial stock for summary',
        })
        .expect(HttpStatus.CREATED);

      await agent
        .post('/stock')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productId: productForSummary.id,
          type: 'out',
          quantity: 15,
          reason: 'Sales',
        })
        .expect(HttpStatus.CREATED);

      // Create another admin in a different group
      const anotherAdminRegisterDto = {
        fullName: 'Another Admin Stock Test',
        email: 'another.admin.stock@example.com',
        password: 'password123',
        phone: '333333333',
        address: 'Another Stock St',
        city: 'Another Stock City',
        country: 'Another Stock Country',
        zipCode: '33333',
      };
      await agent.post('/auth/register').send(anotherAdminRegisterDto).expect(201);
      const anotherAdminLoginResponse = await agent.post('/auth/login').send({ email: anotherAdminRegisterDto.email, password: anotherAdminRegisterDto.password }).expect(201);
      anotherAdminToken = anotherAdminLoginResponse.body.token;

      const anotherAdminUser = await userRepository.findOne({ where: { email: anotherAdminRegisterDto.email } });
      anotherAdminUserId = anotherAdminUser.id;
      const adminRole = await roleRepository.findOne({ where: { name: 'Admin' } });
      anotherAdminUser.roles = [adminRole];
      await userRepository.save(anotherAdminUser);
    });

    it('should allow an admin to get stock summary for a product in their group', async () => {
      setMockUser(adminUserId, true, ['stock:manage']);
      const response = await agent
        .get(`/stock/${productForSummary.id}/summary`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('productId', productForSummary.id);
      expect(response.body).toHaveProperty('currentStock', 35); // 50 - 15
    });

    it('should not allow an admin to get stock summary for a product not in their group', async () => {
      setMockUser(anotherAdminUserId, true, ['stock:manage']);
      await agent
        .get(`/stock/${productForSummary.id}/summary`)
        .set('Authorization', `Bearer ${anotherAdminToken}`)
        .expect(HttpStatus.NOT_FOUND); // Expect 404 if product not in group
    });

    it('should not allow a non-admin to get stock summary', async () => {
      setMockUser(nonAdminUserId, false, []); // No stock:manage permission
      await agent
        .get(`/stock/${productForSummary.id}/summary`)
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should return 404 if product does not exist for summary', async () => {
      setMockUser(adminUserId, true, ['stock:manage']);
      const nonExistentProductId = 99999;
      await agent
        .get(`/stock/${nonExistentProductId}/summary`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});