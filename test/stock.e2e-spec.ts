import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../src/common/guards/permissions.guard';
import { CreateProductDto } from 'src/product/dto/create-product.dto';
import { CreateStockMovementDto } from 'src/stock/dto/create-stock-movement.dto';

const mockAuthGuard = {
  canActivate: jest.fn((context) => {
    const req = context.switchToHttp().getRequest();
    req.user = { id: 1, email: 'peluqueria@glamour.com', isAdmin: true, roles: [{ permissions: [{ name: 'product:manage:group' }] }] };
    return true;
  }),
};

const mockPermissionsGuard = {
  canActivate: jest.fn(() => true),
};

describe('StockController (e2e)', () => {
  let app: INestApplication;
  let agent: request.SuperTest<request.Test>;
  let productId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(mockAuthGuard)
      .overrideGuard(PermissionsGuard)
      .useValue(mockPermissionsGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    agent = request(app.getHttpServer());

    // Create a product to test stock movements against
    const createProductDto: CreateProductDto = {
      name: 'E2E Stock Test Product',
      price: 10.0,
    };
    const productResponse = await agent.post('/products').send(createProductDto);
    productId = productResponse.body.id;
  });

  afterAll(async () => {
    // Clean up the created product
    await agent.delete(`/products/${productId}`);
    await app.close();
  });

  it('POST /stock - should create an initial stock movement (in)', async () => {
    const createStockMovementDto: CreateStockMovementDto = {
      productId,
      quantity: 100,
      type: 'in',
      reason: 'Initial stock',
    };

    const response = await agent
      .post('/stock')
      .send(createStockMovementDto)
      .expect(HttpStatus.CREATED);

    expect(response.body).toHaveProperty('id');
    expect(response.body.quantity).toBe(100);
    expect(response.body.type).toBe('in');
  });

  it('GET /stock/:productId/summary - should reflect the new stock total', async () => {
    const response = await agent.get(`/stock/${productId}/summary`).expect(HttpStatus.OK);
    expect(response.body.availableStock).toBe(100);
  });

  it('POST /stock - should create a usage stock movement (usage)', async () => {
    const createStockMovementDto: CreateStockMovementDto = {
      productId,
      quantity: 10,
      type: 'usage',
      reason: 'Sale',
    };

    await agent.post('/stock').send(createStockMovementDto).expect(HttpStatus.CREATED);
  });

  it('GET /stock/:productId/summary - should show the updated stock total after usage', async () => {
    const response = await agent.get(`/stock/${productId}/summary`).expect(HttpStatus.OK);
    expect(response.body.availableStock).toBe(90); // 100 - 10
  });

  it('GET /stock/:productId - should list all movements for the product', async () => {
    const response = await agent.get(`/stock/${productId}`).expect(HttpStatus.OK);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(2);
    expect(response.body[0].type).toBe('usage');
    expect(response.body[1].type).toBe('in');
  });
});
