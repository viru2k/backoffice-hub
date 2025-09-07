import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { EmailService } from '../email.service';
import { EmailJobData } from '../services/email-queue.service';

@Processor('email-queue')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {}

  @Process('send-email')
  async handleSendEmail(job: Job<EmailJobData>): Promise<void> {
    const { type, emailData, logId, retryCount = 0 } = job.data;
    
    try {
      this.logger.log(`Processing email job: ${logId}, type: ${type}, retry: ${retryCount}`);

      let result;
      
      switch (type) {
        case 'single':
          result = await this.emailService.sendEmail(emailData as any);
          break;
        case 'template':
          result = await this.emailService.sendTemplateEmail(emailData as any);
          break;
        default:
          throw new Error(`Unknown email job type: ${type}`);
      }

      if (!result.success) {
        throw new Error(result.error || 'Email sending failed');
      }

      this.logger.log(`Email job completed successfully: ${logId}`);
      
    } catch (error) {
      this.logger.error(`Email job failed: ${logId}`, error.stack);
      
      // If we've exhausted retries, mark as permanently failed
      if (job.attemptsMade >= job.opts.attempts) {
        this.logger.error(`Email job permanently failed after ${job.attemptsMade} attempts: ${logId}`);
      }
      
      throw error; // Re-throw to let Bull handle retry logic
    }
  }

  @Process('bulk-email')
  async handleBulkEmail(job: Job<{ bulkData: any; logIds: string[] }>): Promise<void> {
    const { bulkData, logIds } = job.data;
    
    try {
      this.logger.log(`Processing bulk email job with ${logIds.length} recipients`);
      
      const result = await this.emailService.sendBulkEmails(bulkData);
      
      this.logger.log(`Bulk email job completed: ${result.successfulSends}/${result.totalRecipients} successful`);
      
    } catch (error) {
      this.logger.error('Bulk email job failed', error.stack);
      throw error;
    }
  }
}