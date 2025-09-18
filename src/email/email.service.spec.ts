import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EmailService } from './email.service';
import { EmailSettings } from './entities/email-settings.entity';
import { EmailTemplate } from './entities/email-template.entity';
import { EmailLog } from './entities/email-log.entity';
import { MailerService } from '@nestjs-modules/mailer';

describe('EmailService', () => {
  let service: EmailService;

  const mockRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  };

  const mockMailerService = {
    sendMail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: getRepositoryToken(EmailSettings),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(EmailTemplate),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(EmailLog),
          useValue: mockRepository,
        },
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have getTemplates method', () => {
    expect(service.getTemplates).toBeDefined();
  });

  it('should have getTemplateById method', () => {
    expect(service.getTemplateById).toBeDefined();
  });

  it('should have sendEmail method', () => {
    expect(service.sendEmail).toBeDefined();
  });

  it('should have sendTemplateEmail method', () => {
    expect(service.sendTemplateEmail).toBeDefined();
  });
});