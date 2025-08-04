import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../src/common/guards/permissions.guard';
import { CreateRoleDto } from 'src/roles/dto/create-role.dto';
import { Permission } from 'src/permissions/entities/permission.entity';

const mockAuthGuard = {
  canActivate: jest.fn((context) => {
    const req = context.switchToHttp().getRequest();
    req.user = { id: 1, email: 'peluqueria@glamour.com', isAdmin: true, roles: [{ permissions: [{ name: 'role:manage' }] }] };
    return true;
  }),
};

const mockPermissionsGuard = {
  canActivate: jest.fn(() => true),
};

describe('RolesController (e2e)', () => {
  let app: INestApplication;
  let agent: request.SuperTest<request.Test>;
  let createdRoleId: number;
  let permissions: Permission[];

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

    // Fetch existing permissions from the seed to use in tests
    const response = await agent.get('/permissions'); // Assuming a /permissions endpoint exists
    permissions = response.body;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /roles - should create a new role without permissions', async () => {
    const createRoleDto: CreateRoleDto = {
      name: 'E2E Test Role',
      description: 'A role for e2e testing',
    };

    const response = await agent
      .post('/roles')
      .send(createRoleDto)
      .expect(HttpStatus.CREATED);

    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe(createRoleDto.name);
    expect(response.body.permissions).toEqual([]);
    createdRoleId = response.body.id;
  });

  it('GET /roles - should get a list of roles', async () => {
    const response = await agent.get('/roles').expect(HttpStatus.OK);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('GET /roles/:id - should get a single role', async () => {
    const response = await agent.get(`/roles/${createdRoleId}`).expect(HttpStatus.OK);
    expect(response.body.id).toBe(createdRoleId);
  });

  it('PATCH /roles/:id - should add permissions to the role', async () => {
    // Find some permissions to add
    const agendaReadOwn = permissions.find(p => p.name === 'agenda:read:own');
    const clientManageGroup = permissions.find(p => p.name === 'client:manage:group');
    const permissionIds = [agendaReadOwn.id, clientManageGroup.id];

    const response = await agent
      .patch(`/roles/${createdRoleId}`)
      .send({ permissionIds })
      .expect(HttpStatus.OK);

    expect(response.body.permissions.length).toBe(2);
    expect(response.body.permissions.map(p => p.id)).toEqual(expect.arrayContaining(permissionIds));
  });
  
  it('PATCH /roles/:id - should remove permissions from the role', async () => {
    const response = await agent
      .patch(`/roles/${createdRoleId}`)
      .send({ permissionIds: [] }) // Send empty array to clear permissions
      .expect(HttpStatus.OK);

    expect(response.body.permissions.length).toBe(0);
  });

  it('POST /roles - should fail to create a role with a duplicate name', async () => {
    const createRoleDto: CreateRoleDto = {
      name: 'E2E Test Role',
      description: 'A duplicate role',
    };

    await agent
      .post('/roles')
      .send(createRoleDto)
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('DELETE /roles/:id - should delete the role', async () => {
    await agent.delete(`/roles/${createdRoleId}`).expect(HttpStatus.NO_CONTENT);
  });
  
  it('GET /roles/:id - should return 404 after deletion', async () => {
    await agent.get(`/roles/${createdRoleId}`).expect(HttpStatus.NOT_FOUND);
  });
});
