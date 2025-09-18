import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { EmailService } from '../email/email.service';

describe('UserService', () => {
  let service: UserService;

  const mockRepository = {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    findByIds: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockEmailService = {
    sendWelcomeEmailByUserId: jest.fn(),
    sendPasswordResetEmailByUserId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Role),
          useValue: mockRepository,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have createSubUser method', () => {
    expect(service.createSubUser).toBeDefined();
  });

  it('should have findById method', () => {
    expect(service.findById).toBeDefined();
  });

  it('should have findByEmail method', () => {
    expect(service.findByEmail).toBeDefined();
  });

  it('should have sendPasswordResetEmail method', () => {
    expect(service.sendPasswordResetEmail).toBeDefined();
  });
});