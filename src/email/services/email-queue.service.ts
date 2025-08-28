import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailLog, EmailStatus } from '../entities/email-log.entity';
import { SendEmailDto, SendTemplateEmailDto } from '../dto/send-email.dto';

export interface EmailJobData {
  type: 'single' | 'template' | 'bulk';
  emailData: SendEmailDto | SendTemplateEmailDto;
  userId?: string;
  logId: string;
  retryCount?: number;
}

export interface QueueStatsDto {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);

  constructor(
    @InjectQueue('email-queue') private emailQueue: Queue<EmailJobData>,
    @InjectRepository(EmailLog)
    private readonly emailLogRepository: Repository<EmailLog>,
  ) {}

  async addToQueue(emailJob: EmailJobData, delay = 0): Promise<void> {
    await this.emailQueue.add('send-email', emailJob, {
      delay,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 60000, // 1 minute
      },
    });

    this.logger.log(`Email job added to queue: ${emailJob.logId}`);
  }

  async addBulkToQueue(emailJobs: EmailJobData[]): Promise<void> {
    const jobs = emailJobs.map(job => ({
      name: 'send-email',
      data: job,
      opts: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 60000,
        },
      },
    }));

    await this.emailQueue.addBulk(jobs);
    this.logger.log(`${emailJobs.length} email jobs added to queue`);
  }

  async retryFailedEmail(logId: string): Promise<void> {
    const emailLog = await this.emailLogRepository.findOne({
      where: { id: logId, status: EmailStatus.FAILED },
    });

    if (!emailLog) {
      throw new Error('Failed email log not found');
    }

    // Create retry job
    const retryJob: EmailJobData = {
      type: 'single',
      emailData: {
        to: emailLog.to,
        cc: emailLog.cc,
        bcc: emailLog.bcc,
        subject: emailLog.subject,
        htmlContent: emailLog.htmlContent,
        textContent: emailLog.textContent,
        priority: emailLog.priority,
      } as SendEmailDto,
      logId: emailLog.id,
      retryCount: 1,
    };

    // Update status to pending
    await this.emailLogRepository.update(logId, {
      status: EmailStatus.PENDING,
      errorMessage: null,
      failedAt: null,
    });

    await this.addToQueue(retryJob);
    this.logger.log(`Retry job created for email: ${logId}`);
  }

  async getQueueStats(): Promise<QueueStatsDto> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.emailQueue.getWaiting(),
      this.emailQueue.getActive(),
      this.emailQueue.getCompleted(),
      this.emailQueue.getFailed(),
      this.emailQueue.getDelayed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
    };
  }

  async pauseQueue(): Promise<void> {
    await this.emailQueue.pause();
    this.logger.log('Email queue paused');
  }

  async resumeQueue(): Promise<void> {
    await this.emailQueue.resume();
    this.logger.log('Email queue resumed');
  }

  async cleanQueue(grace = 0, limit = 100): Promise<void> {
    await this.emailQueue.clean(grace, 'completed', limit);
    await this.emailQueue.clean(grace, 'failed', limit);
    this.logger.log('Email queue cleaned');
  }

  async getFailedJobs(): Promise<any[]> {
    return await this.emailQueue.getFailed();
  }

  async removeJob(jobId: string): Promise<void> {
    const job = await this.emailQueue.getJob(jobId);
    if (job) {
      await job.remove();
      this.logger.log(`Job ${jobId} removed from queue`);
    }
  }
}