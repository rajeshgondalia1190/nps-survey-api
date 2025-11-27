import { IsBoolean, IsOptional, IsUrl, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateNotificationPreferencesDto {
  @ApiPropertyOptional({ description: 'Receive notifications for new survey responses' })
  @IsBoolean()
  @IsOptional()
  newResponses?: boolean;

  @ApiPropertyOptional({ description: 'Receive alerts when NPS changes significantly' })
  @IsBoolean()
  @IsOptional()
  npsAlerts?: boolean;

  @ApiPropertyOptional({ description: 'Receive alerts for detractor responses' })
  @IsBoolean()
  @IsOptional()
  detractorAlerts?: boolean;

  @ApiPropertyOptional({ description: 'Receive weekly summary emails' })
  @IsBoolean()
  @IsOptional()
  weeklySummary?: boolean;

  @ApiPropertyOptional({ description: 'Receive monthly report emails' })
  @IsBoolean()
  @IsOptional()
  monthlyReport?: boolean;

  @ApiPropertyOptional({ description: 'Enable email notifications' })
  @IsBoolean()
  @IsOptional()
  emailNotifications?: boolean;

  @ApiPropertyOptional({ description: 'Enable push notifications' })
  @IsBoolean()
  @IsOptional()
  pushNotifications?: boolean;

  @ApiPropertyOptional({ description: 'Enable Slack notifications' })
  @IsBoolean()
  @IsOptional()
  slackNotifications?: boolean;

  @ApiPropertyOptional({ description: 'Slack webhook URL for notifications' })
  @IsUrl()
  @IsOptional()
  @MaxLength(500)
  slackWebhookUrl?: string;
}
