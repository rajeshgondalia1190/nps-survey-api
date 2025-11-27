import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import {
  DistributionCampaign,
  DistributionType,
  DistributionStatus,
  RecipientSegment,
} from './entities/distribution-campaign.entity';
import { Survey, SurveyStatus } from '../surveys/entities/survey.entity';
import { Customer, CustomerSegment } from '../customers/entities/customer.entity';
import { CreateEmailCampaignDto } from './dto/create-email-campaign.dto';
import { CreateLinkCampaignDto } from './dto/create-link-campaign.dto';
import { CreateWidgetCampaignDto } from './dto/create-widget-campaign.dto';
import { DistributionQueryDto } from './dto/distribution-query.dto';

@Injectable()
export class DistributionService {
  constructor(
    @InjectRepository(DistributionCampaign)
    private campaignsRepository: Repository<DistributionCampaign>,
    @InjectRepository(Survey)
    private surveysRepository: Repository<Survey>,
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
    private configService: ConfigService,
  ) {}

  async findAll(
    organizationId: string,
    query: DistributionQueryDto,
  ): Promise<{ campaigns: DistributionCampaign[]; total: number }> {
    const {
      surveyId,
      type,
      status,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      page = 1,
      limit = 10,
    } = query;

    const queryBuilder = this.campaignsRepository
      .createQueryBuilder('campaign')
      .leftJoinAndSelect('campaign.survey', 'survey')
      .where('campaign.organizationId = :organizationId', { organizationId });

    if (surveyId) {
      queryBuilder.andWhere('campaign.surveyId = :surveyId', { surveyId });
    }

    if (type) {
      queryBuilder.andWhere('campaign.type = :type', { type });
    }

    if (status) {
      queryBuilder.andWhere('campaign.status = :status', { status });
    }

    queryBuilder.orderBy(`campaign.${sortBy}`, sortOrder as 'ASC' | 'DESC');
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [campaigns, total] = await queryBuilder.getManyAndCount();

    return { campaigns, total };
  }

  async findById(id: string, organizationId: string): Promise<DistributionCampaign> {
    const campaign = await this.campaignsRepository.findOne({
      where: { id, organizationId },
      relations: ['survey'],
    });

    if (!campaign) {
      throw new NotFoundException('Distribution campaign not found');
    }

    return campaign;
  }

  async createEmailCampaign(
    organizationId: string,
    createDto: CreateEmailCampaignDto,
  ): Promise<DistributionCampaign> {
    const survey = await this.validateSurvey(createDto.surveyId, organizationId);

    // Get recipients based on segment
    const recipients = await this.getRecipientsBySegment(
      organizationId,
      createDto.recipientSegment,
      createDto.recipientEmails,
    );

    const campaign = this.campaignsRepository.create({
      ...createDto,
      organizationId,
      type: DistributionType.EMAIL,
      status: createDto.scheduleAt ? DistributionStatus.SCHEDULED : DistributionStatus.DRAFT,
      recipientEmails: recipients,
      sentCount: 0,
    });

    return this.campaignsRepository.save(campaign);
  }

  async createLinkCampaign(
    organizationId: string,
    createDto: CreateLinkCampaignDto,
  ): Promise<DistributionCampaign> {
    const survey = await this.validateSurvey(createDto.surveyId, organizationId);

    const shortCode = this.generateShortCode();
    const baseUrl = this.configService.get('VERCEL_URL') || 'http://localhost:3000';
    const url = `${baseUrl}/s/${survey.shareCode}`;

    const campaign = this.campaignsRepository.create({
      name: createDto.name,
      surveyId: createDto.surveyId,
      organizationId,
      type: DistributionType.LINK,
      status: DistributionStatus.ACTIVE,
      url,
      shortCode,
    });

    return this.campaignsRepository.save(campaign);
  }

  async createQrCampaign(
    organizationId: string,
    createDto: CreateLinkCampaignDto,
  ): Promise<DistributionCampaign> {
    const survey = await this.validateSurvey(createDto.surveyId, organizationId);

    const shortCode = this.generateShortCode();
    const baseUrl = this.configService.get('VERCEL_URL') || 'http://localhost:3000';
    const url = `${baseUrl}/s/${survey.shareCode}`;

    // In production, generate actual QR code and store URL
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;

    const campaign = this.campaignsRepository.create({
      name: createDto.name,
      surveyId: createDto.surveyId,
      organizationId,
      type: DistributionType.QR,
      status: DistributionStatus.ACTIVE,
      url,
      shortCode,
      qrCodeUrl,
    });

    return this.campaignsRepository.save(campaign);
  }

  async createWidgetCampaign(
    organizationId: string,
    createDto: CreateWidgetCampaignDto,
  ): Promise<DistributionCampaign> {
    const survey = await this.validateSurvey(createDto.surveyId, organizationId);

    const baseUrl = this.configService.get('VERCEL_URL') || 'http://localhost:3000';

    // Generate embed code
    const embedCode = this.generateEmbedCode(
      survey.shareCode,
      baseUrl,
      createDto.widgetType,
      createDto.widgetTrigger,
      createDto.widgetDelaySeconds,
    );

    const campaign = this.campaignsRepository.create({
      ...createDto,
      organizationId,
      type: DistributionType.WIDGET,
      status: DistributionStatus.ACTIVE,
      url: `${baseUrl}/s/${survey.shareCode}`,
      embedCode,
    });

    return this.campaignsRepository.save(campaign);
  }

  async sendEmailCampaign(id: string, organizationId: string): Promise<DistributionCampaign> {
    const campaign = await this.findById(id, organizationId);

    if (campaign.type !== DistributionType.EMAIL) {
      throw new BadRequestException('This campaign is not an email campaign');
    }

    if (campaign.status !== DistributionStatus.DRAFT && campaign.status !== DistributionStatus.SCHEDULED) {
      throw new BadRequestException('Campaign cannot be sent in current status');
    }

    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    // For now, simulate sending
    campaign.status = DistributionStatus.ACTIVE;
    campaign.sentAt = new Date();
    campaign.sentCount = campaign.recipientEmails?.length || 0;

    return this.campaignsRepository.save(campaign);
  }

  async updateCampaignStats(
    id: string,
    stats: { opened?: number; clicked?: number; responded?: number },
  ): Promise<void> {
    const campaign = await this.campaignsRepository.findOne({ where: { id } });
    if (!campaign) return;

    if (stats.opened) campaign.openedCount += stats.opened;
    if (stats.clicked) campaign.clickedCount += stats.clicked;
    if (stats.responded) campaign.respondedCount += stats.responded;

    await this.campaignsRepository.save(campaign);
  }

  async delete(id: string, organizationId: string): Promise<void> {
    const campaign = await this.findById(id, organizationId);
    await this.campaignsRepository.remove(campaign);
  }

  async getCampaignStats(id: string, organizationId: string): Promise<{
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    responded: number;
    openRate: number;
    clickRate: number;
    responseRate: number;
  }> {
    const campaign = await this.findById(id, organizationId);

    const sent = campaign.sentCount;
    const delivered = campaign.deliveredCount;
    const opened = campaign.openedCount;
    const clicked = campaign.clickedCount;
    const responded = campaign.respondedCount;

    return {
      sent,
      delivered,
      opened,
      clicked,
      responded,
      openRate: sent > 0 ? Math.round((opened / sent) * 1000) / 10 : 0,
      clickRate: sent > 0 ? Math.round((clicked / sent) * 1000) / 10 : 0,
      responseRate: sent > 0 ? Math.round((responded / sent) * 1000) / 10 : 0,
    };
  }

  private async validateSurvey(surveyId: string, organizationId: string): Promise<Survey> {
    const survey = await this.surveysRepository.findOne({
      where: { id: surveyId, organizationId },
    });

    if (!survey) {
      throw new NotFoundException('Survey not found');
    }

    if (survey.status !== SurveyStatus.ACTIVE && survey.status !== SurveyStatus.DRAFT) {
      throw new BadRequestException('Survey must be active or draft to create distribution');
    }

    return survey;
  }

  private async getRecipientsBySegment(
    organizationId: string,
    segment: RecipientSegment,
    customEmails?: string[],
  ): Promise<string[]> {
    if (segment === RecipientSegment.CUSTOM && customEmails) {
      return customEmails;
    }

    const whereCondition: any = { organizationId };

    switch (segment) {
      case RecipientSegment.PROMOTERS:
        whereCondition.segment = CustomerSegment.PROMOTER;
        break;
      case RecipientSegment.PASSIVES:
        whereCondition.segment = CustomerSegment.PASSIVE;
        break;
      case RecipientSegment.DETRACTORS:
        whereCondition.segment = CustomerSegment.DETRACTOR;
        break;
      case RecipientSegment.NO_RESPONSE:
        whereCondition.segment = null;
        break;
      case RecipientSegment.ALL:
      default:
        break;
    }

    const customers = await this.customersRepository.find({
      where: whereCondition,
      select: ['email'],
    });

    return customers.map((c) => c.email);
  }

  private generateShortCode(): string {
    return uuidv4().replace(/-/g, '').substring(0, 8);
  }

  private generateEmbedCode(
    shareCode: string,
    baseUrl: string,
    widgetType: string,
    trigger: string,
    delaySeconds?: number,
  ): string {
    return `<!-- NPS Survey Widget -->
<script>
(function() {
  var config = {
    surveyUrl: '${baseUrl}/s/${shareCode}',
    widgetType: '${widgetType}',
    trigger: '${trigger}',
    ${delaySeconds ? `delay: ${delaySeconds * 1000},` : ''}
  };

  var script = document.createElement('script');
  script.src = '${baseUrl}/widget.js';
  script.async = true;
  script.onload = function() {
    if (window.NPSSurvey) {
      window.NPSSurvey.init(config);
    }
  };
  document.head.appendChild(script);
})();
</script>
<!-- End NPS Survey Widget -->`;
  }
}
