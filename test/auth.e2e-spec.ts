import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { getConnection } from 'typeorm';

describe('Auth Controller (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Clear the database before each test
    const connection = getConnection();
    await connection.synchronize(true); // This will drop and recreate the schema
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
        phone: '123456789',
        address: '123 Test St',
        city: 'Test City',
        country: 'Test Country',
        zipCode: '12345',
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
        phone: '987654321',
        address: '456 Login Ave',
        city: 'Login City',
        country: 'Login Country',
        zipCode: '54321',
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
        phone: '111222333',
        address: '789 Profile St',
        city: 'Profile City',
        country: 'Profile Country',
        zipCode: '67890',
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

    it('should return the authenticated user's profile', async () => {
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
