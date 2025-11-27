import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { UpdateBrandingDto } from './dto/update-branding.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('organizations')
@Controller('organizations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user organization' })
  @ApiResponse({ status: 200, description: 'Organization retrieved' })
  async getMyOrganization(@CurrentUser('organizationId') organizationId: string) {
    const organization = await this.organizationsService.findById(organizationId);
    return { organization };
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update organization details' })
  @ApiResponse({ status: 200, description: 'Organization updated' })
  async updateOrganization(
    @CurrentUser('id') userId: string,
    @CurrentUser('organizationId') organizationId: string,
    @Body() updateDto: UpdateOrganizationDto,
  ) {
    const organization = await this.organizationsService.update(
      organizationId,
      userId,
      updateDto,
    );
    return { organization, message: 'Organization updated successfully' };
  }

  @Patch('me/branding')
  @ApiOperation({ summary: 'Update organization branding' })
  @ApiResponse({ status: 200, description: 'Branding updated' })
  async updateBranding(
    @CurrentUser('id') userId: string,
    @CurrentUser('organizationId') organizationId: string,
    @Body() brandingDto: UpdateBrandingDto,
  ) {
    const organization = await this.organizationsService.updateBranding(
      organizationId,
      userId,
      brandingDto,
    );
    return { organization, message: 'Branding updated successfully' };
  }

  @Get('me/usage')
  @ApiOperation({ summary: 'Get organization usage statistics' })
  @ApiResponse({ status: 200, description: 'Usage statistics retrieved' })
  async getUsage(@CurrentUser('organizationId') organizationId: string) {
    const usage = await this.organizationsService.getUsageStats(organizationId);
    return { usage };
  }
}
