import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';

import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { EmailQueueService } from './services/email-queue.service';
import { EmailAnalyticsService } from './services/email-analytics.service';
import { EmailProcessor } from './processors/email.processor';

import { EmailSettings } from './entities/email-settings.entity';
import { EmailTemplate } from './entities/email-template.entity';
import { EmailLog } from './entities/email-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailSettings, EmailTemplate, EmailLog]),
    BullModule.registerQueue({
      name: 'email-queue',
      redis: {
        host: process.env.EMAIL_QUEUE_REDIS_HOST || 'localhost',
        port: parseInt(process.env.EMAIL_QUEUE_REDIS_PORT, 10) || 6379,
      },
    }),
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.MAIL_PORT, 10) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.MAIL_USER || 'your-email@gmail.com',
          pass: process.env.MAIL_PASS || 'your-app-password',
        },
        tls: {
          rejectUnauthorized: false,
        },
      },
      defaults: {
        from: process.env.MAIL_FROM || '"Orbyt Support" <noreply@orbyt.com>',
      },
      template: {
        dir: join(__dirname, 'templates'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
  controllers: [EmailController],
  providers: [
    EmailService,
    EmailQueueService,
    EmailAnalyticsService,
    EmailProcessor,
  ],
  exports: [EmailService, EmailQueueService, EmailAnalyticsService],
})
export class EmailModule {}