import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('settings')
@Controller('settings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all settings' })
  @ApiResponse({ status: 200, description: 'Settings retrieved' })
  async getAllSettings(
    @CurrentUser('id') userId: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    const settings = await this.settingsService.getAllSettings(userId, organizationId);
    return { settings };
  }

  @Get('account')
  @ApiOperation({ summary: 'Get account settings' })
  @ApiResponse({ status: 200, description: 'Account settings retrieved' })
  async getAccountSettings(@CurrentUser('id') userId: string) {
    const account = await this.settingsService.getAccountSettings(userId);
    return { account };
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Get notification preferences' })
  @ApiResponse({ status: 200, description: 'Notification preferences retrieved' })
  async getNotificationPreferences(@CurrentUser('id') userId: string) {
    const preferences = await this.settingsService.getNotificationPreferences(userId);
    return { preferences };
  }

  @Patch('notifications')
  @ApiOperation({ summary: 'Update notification preferences' })
  @ApiResponse({ status: 200, description: 'Notification preferences updated' })
  async updateNotificationPreferences(
    @CurrentUser('id') userId: string,
    @Body() updateDto: UpdateNotificationPreferencesDto,
  ) {
    const preferences = await this.settingsService.updateNotificationPreferences(userId, updateDto);
    return { preferences, message: 'Notification preferences updated successfully' };
  }

  @Get('security')
  @ApiOperation({ summary: 'Get security settings' })
  @ApiResponse({ status: 200, description: 'Security settings retrieved' })
  async getSecuritySettings(@CurrentUser('id') userId: string) {
    const security = await this.settingsService.getSecuritySettings(userId);
    return { security };
  }

  @Post('security/2fa/enable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable two-factor authentication' })
  @ApiResponse({ status: 200, description: '2FA setup initiated' })
  async enableTwoFactor(@CurrentUser('id') userId: string) {
    const result = await this.settingsService.enableTwoFactor(userId);
    return { ...result, message: 'Scan the QR code with your authenticator app' };
  }

  @Post('security/2fa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify and activate 2FA' })
  @ApiResponse({ status: 200, description: '2FA activated' })
  @ApiResponse({ status: 400, description: 'Invalid code' })
  async verifyTwoFactor(
    @CurrentUser('id') userId: string,
    @Body('code') code: string,
  ) {
    const success = await this.settingsService.verifyAndEnableTwoFactor(userId, code);
    if (!success) {
      return { success: false, message: 'Invalid verification code' };
    }
    return { success: true, message: 'Two-factor authentication enabled' };
  }

  @Post('security/2fa/disable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable two-factor authentication' })
  @ApiResponse({ status: 200, description: '2FA disabled' })
  async disableTwoFactor(@CurrentUser('id') userId: string) {
    await this.settingsService.disableTwoFactor(userId);
    return { message: 'Two-factor authentication disabled' };
  }

  @Get('billing')
  @ApiOperation({ summary: 'Get billing information' })
  @ApiResponse({ status: 200, description: 'Billing info retrieved' })
  async getBillingInfo(@CurrentUser('organizationId') organizationId: string) {
    const billing = await this.settingsService.getBillingInfo(organizationId);
    return { billing };
  }
}
