import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DistributionService } from './distribution.service';
import { CreateEmailCampaignDto } from './dto/create-email-campaign.dto';
import { CreateLinkCampaignDto } from './dto/create-link-campaign.dto';
import { CreateWidgetCampaignDto } from './dto/create-widget-campaign.dto';
import { DistributionQueryDto } from './dto/distribution-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('distribution')
@Controller('distributions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DistributionController {
  constructor(private readonly distributionService: DistributionService) {}

  @Get()
  @ApiOperation({ summary: 'Get all distribution campaigns' })
  @ApiResponse({ status: 200, description: 'Campaigns retrieved' })
  async findAll(
    @CurrentUser('organizationId') organizationId: string,
    @Query() query: DistributionQueryDto,
  ) {
    const { campaigns, total } = await this.distributionService.findAll(organizationId, query);
    return {
      campaigns,
      total,
      page: query.page || 1,
      limit: query.limit || 10,
      totalPages: Math.ceil(total / (query.limit || 10)),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get campaign by ID' })
  @ApiResponse({ status: 200, description: 'Campaign retrieved' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async findOne(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    const campaign = await this.distributionService.findById(id, organizationId);
    return { campaign };
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get campaign statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getStats(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    const stats = await this.distributionService.getCampaignStats(id, organizationId);
    return { stats };
  }

  @Post('email')
  @ApiOperation({ summary: 'Create email campaign' })
  @ApiResponse({ status: 201, description: 'Email campaign created' })
  async createEmailCampaign(
    @CurrentUser('organizationId') organizationId: string,
    @Body() createDto: CreateEmailCampaignDto,
  ) {
    const campaign = await this.distributionService.createEmailCampaign(organizationId, createDto);
    return { campaign, message: 'Email campaign created successfully' };
  }

  @Post('link')
  @ApiOperation({ summary: 'Create shareable link' })
  @ApiResponse({ status: 201, description: 'Link created' })
  async createLinkCampaign(
    @CurrentUser('organizationId') organizationId: string,
    @Body() createDto: CreateLinkCampaignDto,
  ) {
    const campaign = await this.distributionService.createLinkCampaign(organizationId, createDto);
    return {
      campaign,
      url: campaign.url,
      message: 'Shareable link created successfully',
    };
  }

  @Post('qr')
  @ApiOperation({ summary: 'Create QR code campaign' })
  @ApiResponse({ status: 201, description: 'QR code created' })
  async createQrCampaign(
    @CurrentUser('organizationId') organizationId: string,
    @Body() createDto: CreateLinkCampaignDto,
  ) {
    const campaign = await this.distributionService.createQrCampaign(organizationId, createDto);
    return {
      campaign,
      url: campaign.url,
      qrCodeUrl: campaign.qrCodeUrl,
      message: 'QR code created successfully',
    };
  }

  @Post('widget')
  @ApiOperation({ summary: 'Create website widget' })
  @ApiResponse({ status: 201, description: 'Widget created' })
  async createWidgetCampaign(
    @CurrentUser('organizationId') organizationId: string,
    @Body() createDto: CreateWidgetCampaignDto,
  ) {
    const campaign = await this.distributionService.createWidgetCampaign(organizationId, createDto);
    return {
      campaign,
      embedCode: campaign.embedCode,
      message: 'Widget created successfully',
    };
  }

  @Post(':id/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send email campaign' })
  @ApiResponse({ status: 200, description: 'Campaign sent' })
  async sendCampaign(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    const campaign = await this.distributionService.sendEmailCampaign(id, organizationId);
    return { campaign, message: 'Campaign sent successfully' };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete campaign' })
  @ApiResponse({ status: 204, description: 'Campaign deleted' })
  async delete(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    await this.distributionService.delete(id, organizationId);
  }
}
