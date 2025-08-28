import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { EmailLog, EmailStatus } from '../entities/email-log.entity';
import { EmailTemplate } from '../entities/email-template.entity';
import { 
  EmailLogsQueryDto, 
  EmailLogsPaginatedResponseDto, 
  EmailMetricsResponseDto, 
  EmailMetricsSummaryDto, 
  DateRangeQueryDto 
} from '../dto/email-logs.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class EmailAnalyticsService {
  private readonly logger = new Logger(EmailAnalyticsService.name);

  constructor(
    @InjectRepository(EmailLog)
    private readonly emailLogRepository: Repository<EmailLog>,
    @InjectRepository(EmailTemplate)
    private readonly emailTemplateRepository: Repository<EmailTemplate>,
  ) {}

  async getEmailLogs(query: EmailLogsQueryDto): Promise<EmailLogsPaginatedResponseDto> {
    const { status, startDate, endDate, templateId, page = 1, limit = 20 } = query;

    const queryBuilder = this.emailLogRepository.createQueryBuilder('log');

    if (status) {
      queryBuilder.andWhere('log.status = :status', { status });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('log.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    }

    if (templateId) {
      queryBuilder.andWhere('log.templateUsed = :templateId', { templateId });
    }

    queryBuilder
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [logs, total] = await queryBuilder.getManyAndCount();

    return {
      data: plainToInstance(EmailLog, logs),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getFailedEmails(): Promise<EmailLog[]> {
    return await this.emailLogRepository.find({
      where: { status: EmailStatus.FAILED },
      order: { failedAt: 'DESC' },
      take: 100,
    });
  }

  async getEmailMetrics(dateRange?: DateRangeQueryDto): Promise<EmailMetricsResponseDto> {
    const startDate = dateRange?.startDate ? new Date(dateRange.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = dateRange?.endDate ? new Date(dateRange.endDate) : new Date();

    // Basic counts
    const totalSent = await this.emailLogRepository.count({
      where: { 
        status: EmailStatus.SENT,
        createdAt: Between(startDate, endDate),
      },
    });

    const totalFailed = await this.emailLogRepository.count({
      where: { 
        status: EmailStatus.FAILED,
        createdAt: Between(startDate, endDate),
      },
    });

    const totalPending = await this.emailLogRepository.count({
      where: { 
        status: EmailStatus.PENDING,
        createdAt: Between(startDate, endDate),
      },
    });

    const successRate = totalSent + totalFailed > 0 ? (totalSent / (totalSent + totalFailed)) * 100 : 0;

    // Average delivery time calculation
    const sentEmails = await this.emailLogRepository.find({
      where: { 
        status: EmailStatus.SENT,
        createdAt: Between(startDate, endDate),
      },
      select: ['createdAt', 'sentAt'],
    });

    const averageDeliveryTime = sentEmails.length > 0 
      ? sentEmails.reduce((sum, email) => {
          const deliveryTime = email.sentAt.getTime() - email.createdAt.getTime();
          return sum + deliveryTime;
        }, 0) / sentEmails.length / 1000 // Convert to seconds
      : 0;

    // Top templates
    const topTemplatesQuery = await this.emailLogRepository
      .createQueryBuilder('log')
      .select('log.templateUsed', 'templateId')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(CASE WHEN log.status = :sentStatus THEN 1 ELSE 0 END)', 'successCount')
      .where('log.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('log.templateUsed IS NOT NULL')
      .setParameter('sentStatus', EmailStatus.SENT)
      .groupBy('log.templateUsed')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    const topTemplates = await Promise.all(
      topTemplatesQuery.map(async (item) => {
        const template = await this.emailTemplateRepository.findOne({
          where: { id: item.templateId },
        });
        
        const count = parseInt(item.count);
        const successCount = parseInt(item.successCount);
        
        return {
          id: item.templateId,
          name: template?.name || 'Unknown Template',
          count,
          successRate: count > 0 ? (successCount / count) * 100 : 0,
        };
      })
    );

    // Daily stats
    const dailyStatsQuery = await this.emailLogRepository
      .createQueryBuilder('log')
      .select('DATE(log.createdAt)', 'date')
      .addSelect('SUM(CASE WHEN log.status = :sentStatus THEN 1 ELSE 0 END)', 'sent')
      .addSelect('SUM(CASE WHEN log.status = :failedStatus THEN 1 ELSE 0 END)', 'failed')
      .addSelect('SUM(CASE WHEN log.status = :pendingStatus THEN 1 ELSE 0 END)', 'pending')
      .where('log.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .setParameter('sentStatus', EmailStatus.SENT)
      .setParameter('failedStatus', EmailStatus.FAILED)
      .setParameter('pendingStatus', EmailStatus.PENDING)
      .groupBy('DATE(log.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    const dailyStats = dailyStatsQuery.map(item => ({
      date: item.date,
      sent: parseInt(item.sent),
      failed: parseInt(item.failed),
      pending: parseInt(item.pending),
    }));

    // Hourly distribution
    const hourlyDistributionQuery = await this.emailLogRepository
      .createQueryBuilder('log')
      .select('HOUR(log.createdAt)', 'hour')
      .addSelect('COUNT(*)', 'count')
      .where('log.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('HOUR(log.createdAt)')
      .orderBy('hour', 'ASC')
      .getRawMany();

    const hourlyDistribution = hourlyDistributionQuery.map(item => ({
      hour: parseInt(item.hour),
      count: parseInt(item.count),
    }));

    // Error analysis
    const errorAnalysisQuery = await this.emailLogRepository
      .createQueryBuilder('log')
      .select('log.errorMessage', 'error')
      .addSelect('COUNT(*)', 'count')
      .where('log.status = :failedStatus', { failedStatus: EmailStatus.FAILED })
      .andWhere('log.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('log.errorMessage IS NOT NULL')
      .groupBy('log.errorMessage')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    const errorAnalysis = errorAnalysisQuery.map(item => {
      const count = parseInt(item.count);
      return {
        error: item.error,
        count,
        percentage: totalFailed > 0 ? (count / totalFailed) * 100 : 0,
      };
    });

    return {
      totalSent,
      totalFailed,
      totalPending,
      successRate,
      averageDeliveryTime,
      topTemplates,
      dailyStats,
      hourlyDistribution,
      errorAnalysis,
    };
  }

  async getMetricsSummary(): Promise<EmailMetricsSummaryDto> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const todaysSent = await this.emailLogRepository.count({
      where: { 
        status: EmailStatus.SENT,
        createdAt: Between(startOfDay, today),
      },
    });

    const todaysFailed = await this.emailLogRepository.count({
      where: { 
        status: EmailStatus.FAILED,
        createdAt: Between(startOfDay, today),
      },
    });

    const weeklyStats = await this.emailLogRepository
      .createQueryBuilder('log')
      .select('COUNT(CASE WHEN log.status = :sentStatus THEN 1 END)', 'sent')
      .addSelect('COUNT(CASE WHEN log.status = :failedStatus THEN 1 END)', 'failed')
      .where('log.createdAt >= :startOfWeek', { startOfWeek })
      .setParameter('sentStatus', EmailStatus.SENT)
      .setParameter('failedStatus', EmailStatus.FAILED)
      .getRawOne();

    const weeklySent = parseInt(weeklyStats.sent) || 0;
    const weeklyFailed = parseInt(weeklyStats.failed) || 0;
    const weeklySuccessRate = weeklySent + weeklyFailed > 0 ? (weeklySent / (weeklySent + weeklyFailed)) * 100 : 0;

    const activeTemplates = await this.emailTemplateRepository.count({
      where: { isActive: true },
    });

    const queuedEmails = await this.emailLogRepository.count({
      where: { status: EmailStatus.PENDING },
    });

    return {
      todaysSent,
      todaysFailed,
      weeklySuccessRate,
      activeTemplates,
      queuedEmails,
    };
  }

  async trackOpen(emailId: string): Promise<void> {
    const emailLog = await this.emailLogRepository.findOne({ where: { id: emailId } });
    
    if (emailLog) {
      const stats = emailLog.deliveryStats || { opens: 0, clicks: 0, bounces: 0 };
      stats.opens += 1;
      
      await this.emailLogRepository.update(emailId, { deliveryStats: stats });
      this.logger.log(`Email open tracked for: ${emailId}`);
    }
  }

  async trackClick(emailId: string, linkUrl: string): Promise<void> {
    const emailLog = await this.emailLogRepository.findOne({ where: { id: emailId } });
    
    if (emailLog) {
      const stats = emailLog.deliveryStats || { opens: 0, clicks: 0, bounces: 0 };
      stats.clicks += 1;
      
      await this.emailLogRepository.update(emailId, { deliveryStats: stats });
      this.logger.log(`Email click tracked for: ${emailId}, URL: ${linkUrl}`);
    }
  }

  async recordBounce(emailId: string, reason: string): Promise<void> {
    const emailLog = await this.emailLogRepository.findOne({ where: { id: emailId } });
    
    if (emailLog) {
      const stats = emailLog.deliveryStats || { opens: 0, clicks: 0, bounces: 0 };
      stats.bounces += 1;
      
      await this.emailLogRepository.update(emailId, { 
        deliveryStats: stats,
        errorMessage: reason,
      });
      
      this.logger.log(`Email bounce recorded for: ${emailId}, Reason: ${reason}`);
    }
  }
}