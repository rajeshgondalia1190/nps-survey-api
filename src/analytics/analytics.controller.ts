import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard metrics' })
  @ApiResponse({ status: 200, description: 'Dashboard metrics retrieved' })
  async getDashboard(@CurrentUser('organizationId') organizationId: string) {
    const metrics = await this.analyticsService.getDashboardMetrics(organizationId);
    return { metrics };
  }

  @Get('nps-trend')
  @ApiOperation({ summary: 'Get NPS trend over time' })
  @ApiResponse({ status: 200, description: 'NPS trend data retrieved' })
  async getNpsTrend(
    @CurrentUser('organizationId') organizationId: string,
    @Query('timeframe') timeframe?: 'week' | 'month' | 'quarter' | 'year',
  ) {
    const trend = await this.analyticsService.getNpsTrend(organizationId, timeframe);
    return { trend };
  }

  @Get('segment-distribution')
  @ApiOperation({ summary: 'Get segment distribution' })
  @ApiResponse({ status: 200, description: 'Segment distribution retrieved' })
  async getSegmentDistribution(@CurrentUser('organizationId') organizationId: string) {
    const distribution = await this.analyticsService.getSegmentDistribution(organizationId);
    return { distribution };
  }

  @Get('survey-performance')
  @ApiOperation({ summary: 'Get survey performance metrics' })
  @ApiResponse({ status: 200, description: 'Survey performance retrieved' })
  async getSurveyPerformance(@CurrentUser('organizationId') organizationId: string) {
    const surveys = await this.analyticsService.getSurveyPerformance(organizationId);
    return { surveys };
  }

  @Get('customer-segments')
  @ApiOperation({ summary: 'Get customer segment analysis' })
  @ApiResponse({ status: 200, description: 'Customer segment analysis retrieved' })
  async getCustomerSegments(@CurrentUser('organizationId') organizationId: string) {
    const analysis = await this.analyticsService.getCustomerSegmentAnalysis(organizationId);
    return analysis;
  }

  @Get('response-times')
  @ApiOperation({ summary: 'Get responses by time of day' })
  @ApiResponse({ status: 200, description: 'Response times retrieved' })
  async getResponseTimes(@CurrentUser('organizationId') organizationId: string) {
    const times = await this.analyticsService.getResponsesByTimeOfDay(organizationId);
    return { times };
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get audit logs' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved' })
  async getAuditLogs(
    @CurrentUser('organizationId') organizationId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const { logs, total } = await this.analyticsService.getAuditLogs(organizationId, {
      page: page || 1,
      limit: limit || 50,
    });
    return {
      logs,
      total,
      page: page || 1,
      limit: limit || 50,
      totalPages: Math.ceil(total / (limit || 50)),
    };
  }
}
