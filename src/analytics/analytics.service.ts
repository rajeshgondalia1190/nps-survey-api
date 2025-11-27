import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Survey, SurveyStatus } from '../surveys/entities/survey.entity';
import { SurveyResponse, ResponseStatus } from '../responses/entities/survey-response.entity';
import { Customer, CustomerSegment } from '../customers/entities/customer.entity';
import { AuditLog, AuditAction, AuditResourceType } from './entities/audit-log.entity';

export interface DashboardMetrics {
  npsScore: number;
  totalResponses: number;
  responseRate: number;
  activeSurveys: number;
  totalCustomers: number;
  promotersPercentage: number;
  passivesPercentage: number;
  detractorsPercentage: number;
}

export interface TrendDataPoint {
  date: string;
  nps: number;
  responses: number;
  promoters: number;
  passives: number;
  detractors: number;
}

export interface SegmentDistribution {
  promoters: number;
  passives: number;
  detractors: number;
  promotersPercentage: number;
  passivesPercentage: number;
  detractorsPercentage: number;
}

export interface SurveyPerformance {
  id: string;
  title: string;
  npsScore: number;
  responseCount: number;
  targetResponses: number;
  responseRate: number;
  status: SurveyStatus;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Survey)
    private surveysRepository: Repository<Survey>,
    @InjectRepository(SurveyResponse)
    private responsesRepository: Repository<SurveyResponse>,
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
    @InjectRepository(AuditLog)
    private auditLogsRepository: Repository<AuditLog>,
  ) {}

  async getDashboardMetrics(organizationId: string): Promise<DashboardMetrics> {
    // Get survey stats
    const surveys = await this.surveysRepository.find({
      where: { organizationId },
    });

    const activeSurveys = surveys.filter((s) => s.status === SurveyStatus.ACTIVE).length;
    const totalTargetResponses = surveys.reduce((sum, s) => sum + s.targetResponses, 0);
    const totalResponses = surveys.reduce((sum, s) => sum + s.responseCount, 0);

    // Get customer count
    const totalCustomers = await this.customersRepository.count({
      where: { organizationId },
    });

    // Get response stats
    const responseStats = await this.responsesRepository
      .createQueryBuilder('response')
      .leftJoin('response.survey', 'survey')
      .select('COUNT(*)', 'total')
      .addSelect('SUM(CASE WHEN response.segment = :promoter THEN 1 ELSE 0 END)', 'promoters')
      .addSelect('SUM(CASE WHEN response.segment = :passive THEN 1 ELSE 0 END)', 'passives')
      .addSelect('SUM(CASE WHEN response.segment = :detractor THEN 1 ELSE 0 END)', 'detractors')
      .where('survey.organizationId = :organizationId', { organizationId })
      .andWhere('response.status = :status', { status: ResponseStatus.COMPLETED })
      .setParameters({
        promoter: CustomerSegment.PROMOTER,
        passive: CustomerSegment.PASSIVE,
        detractor: CustomerSegment.DETRACTOR,
      })
      .getRawOne();

    const total = parseInt(responseStats.total) || 0;
    const promoters = parseInt(responseStats.promoters) || 0;
    const passives = parseInt(responseStats.passives) || 0;
    const detractors = parseInt(responseStats.detractors) || 0;

    const npsScore = total > 0 ? Math.round(((promoters - detractors) / total) * 100) : 0;
    const responseRate = totalTargetResponses > 0 ? (totalResponses / totalTargetResponses) * 100 : 0;

    return {
      npsScore,
      totalResponses: total,
      responseRate: Math.round(responseRate * 10) / 10,
      activeSurveys,
      totalCustomers,
      promotersPercentage: total > 0 ? Math.round((promoters / total) * 1000) / 10 : 0,
      passivesPercentage: total > 0 ? Math.round((passives / total) * 1000) / 10 : 0,
      detractorsPercentage: total > 0 ? Math.round((detractors / total) * 1000) / 10 : 0,
    };
  }

  async getNpsTrend(
    organizationId: string,
    timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month',
  ): Promise<TrendDataPoint[]> {
    const now = new Date();
    let startDate: Date;
    let groupBy: string;
    let dateFormat: string;

    switch (timeframe) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupBy = 'DATE(response.created_at)';
        dateFormat = 'YYYY-MM-DD';
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        groupBy = 'DATE(response.created_at)';
        dateFormat = 'YYYY-MM-DD';
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        groupBy = "TO_CHAR(response.created_at, 'YYYY-WW')";
        dateFormat = 'YYYY-WW';
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        groupBy = "TO_CHAR(response.created_at, 'YYYY-MM')";
        dateFormat = 'YYYY-MM';
        break;
    }

    const results = await this.responsesRepository
      .createQueryBuilder('response')
      .leftJoin('response.survey', 'survey')
      .select(groupBy, 'date')
      .addSelect('COUNT(*)', 'responses')
      .addSelect('SUM(CASE WHEN response.segment = :promoter THEN 1 ELSE 0 END)', 'promoters')
      .addSelect('SUM(CASE WHEN response.segment = :passive THEN 1 ELSE 0 END)', 'passives')
      .addSelect('SUM(CASE WHEN response.segment = :detractor THEN 1 ELSE 0 END)', 'detractors')
      .where('survey.organizationId = :organizationId', { organizationId })
      .andWhere('response.status = :status', { status: ResponseStatus.COMPLETED })
      .andWhere('response.createdAt >= :startDate', { startDate })
      .setParameters({
        promoter: CustomerSegment.PROMOTER,
        passive: CustomerSegment.PASSIVE,
        detractor: CustomerSegment.DETRACTOR,
      })
      .groupBy(groupBy)
      .orderBy(groupBy, 'ASC')
      .getRawMany();

    return results.map((r) => {
      const total = parseInt(r.responses) || 0;
      const promoters = parseInt(r.promoters) || 0;
      const detractors = parseInt(r.detractors) || 0;
      const nps = total > 0 ? Math.round(((promoters - detractors) / total) * 100) : 0;

      return {
        date: r.date,
        nps,
        responses: total,
        promoters,
        passives: parseInt(r.passives) || 0,
        detractors,
      };
    });
  }

  async getSegmentDistribution(organizationId: string): Promise<SegmentDistribution> {
    const stats = await this.responsesRepository
      .createQueryBuilder('response')
      .leftJoin('response.survey', 'survey')
      .select('COUNT(*)', 'total')
      .addSelect('SUM(CASE WHEN response.segment = :promoter THEN 1 ELSE 0 END)', 'promoters')
      .addSelect('SUM(CASE WHEN response.segment = :passive THEN 1 ELSE 0 END)', 'passives')
      .addSelect('SUM(CASE WHEN response.segment = :detractor THEN 1 ELSE 0 END)', 'detractors')
      .where('survey.organizationId = :organizationId', { organizationId })
      .andWhere('response.status = :status', { status: ResponseStatus.COMPLETED })
      .setParameters({
        promoter: CustomerSegment.PROMOTER,
        passive: CustomerSegment.PASSIVE,
        detractor: CustomerSegment.DETRACTOR,
      })
      .getRawOne();

    const total = parseInt(stats.total) || 0;
    const promoters = parseInt(stats.promoters) || 0;
    const passives = parseInt(stats.passives) || 0;
    const detractors = parseInt(stats.detractors) || 0;

    return {
      promoters,
      passives,
      detractors,
      promotersPercentage: total > 0 ? Math.round((promoters / total) * 1000) / 10 : 0,
      passivesPercentage: total > 0 ? Math.round((passives / total) * 1000) / 10 : 0,
      detractorsPercentage: total > 0 ? Math.round((detractors / total) * 1000) / 10 : 0,
    };
  }

  async getSurveyPerformance(organizationId: string): Promise<SurveyPerformance[]> {
    const surveys = await this.surveysRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
      take: 20,
    });

    return surveys.map((s) => ({
      id: s.id,
      title: s.title,
      npsScore: s.npsScore || 0,
      responseCount: s.responseCount,
      targetResponses: s.targetResponses,
      responseRate: s.targetResponses > 0 ? Math.round((s.responseCount / s.targetResponses) * 1000) / 10 : 0,
      status: s.status,
    }));
  }

  async getCustomerSegmentAnalysis(organizationId: string): Promise<{
    segments: Array<{
      name: string;
      count: number;
      percentage: number;
      avgNps: number;
      trend: number;
    }>;
  }> {
    const segments = [
      { segment: CustomerSegment.PROMOTER, name: 'Promoters' },
      { segment: CustomerSegment.PASSIVE, name: 'Passives' },
      { segment: CustomerSegment.DETRACTOR, name: 'Detractors' },
    ];

    const totalCustomers = await this.customersRepository.count({
      where: { organizationId },
    });

    const result: Array<{
      name: string;
      count: number;
      percentage: number;
      avgNps: number;
      trend: number;
    }> = [];

    for (const seg of segments) {
      const customers = await this.customersRepository.find({
        where: { organizationId, segment: seg.segment },
      });

      const count = customers.length;
      const avgNps = customers.length > 0
        ? Math.round(customers.reduce((sum, c) => sum + (c.npsScore || 0), 0) / customers.length * 10) / 10
        : 0;

      result.push({
        name: seg.name,
        count,
        percentage: totalCustomers > 0 ? Math.round((count / totalCustomers) * 1000) / 10 : 0,
        avgNps,
        trend: 0, // Would need historical data to calculate
      });
    }

    return { segments: result };
  }

  async getResponsesByTimeOfDay(organizationId: string): Promise<Array<{ hour: number; count: number }>> {
    const results = await this.responsesRepository
      .createQueryBuilder('response')
      .leftJoin('response.survey', 'survey')
      .select('EXTRACT(HOUR FROM response.created_at)', 'hour')
      .addSelect('COUNT(*)', 'count')
      .where('survey.organizationId = :organizationId', { organizationId })
      .andWhere('response.status = :status', { status: ResponseStatus.COMPLETED })
      .groupBy('EXTRACT(HOUR FROM response.created_at)')
      .orderBy('hour', 'ASC')
      .getRawMany();

    return results.map((r) => ({
      hour: parseInt(r.hour),
      count: parseInt(r.count),
    }));
  }

  // Audit logging
  async createAuditLog(data: {
    organizationId?: string;
    userId?: string;
    action: AuditAction;
    resourceType: AuditResourceType;
    resourceId?: string;
    description?: string;
    changes?: Record<string, any>;
    previousValues?: Record<string, any>;
    newValues?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuditLog> {
    const log = this.auditLogsRepository.create(data);
    return this.auditLogsRepository.save(log);
  }

  async getAuditLogs(
    organizationId: string,
    options?: {
      userId?: string;
      resourceType?: AuditResourceType;
      action?: AuditAction;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    },
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const { userId, resourceType, action, startDate, endDate, page = 1, limit = 50 } = options || {};

    const queryBuilder = this.auditLogsRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .where('log.organizationId = :organizationId', { organizationId });

    if (userId) {
      queryBuilder.andWhere('log.userId = :userId', { userId });
    }

    if (resourceType) {
      queryBuilder.andWhere('log.resourceType = :resourceType', { resourceType });
    }

    if (action) {
      queryBuilder.andWhere('log.action = :action', { action });
    }

    if (startDate) {
      queryBuilder.andWhere('log.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('log.createdAt <= :endDate', { endDate });
    }

    queryBuilder.orderBy('log.createdAt', 'DESC');
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [logs, total] = await queryBuilder.getManyAndCount();

    return { logs, total };
  }
}
