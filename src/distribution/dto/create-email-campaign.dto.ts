import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  IsDateString,
  MaxLength,
  IsEmail,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RecipientSegment } from '../entities/distribution-campaign.entity';

export class CreateEmailCampaignDto {
  @ApiProperty({ description: 'Campaign name' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Survey ID to distribute' })
  @IsString()
  surveyId: string;

  @ApiProperty({ enum: RecipientSegment, description: 'Recipient segment' })
  @IsEnum(RecipientSegment)
  recipientSegment: RecipientSegment;

  @ApiPropertyOptional({ description: 'Custom recipient emails (when segment is CUSTOM)' })
  @IsArray()
  @IsEmail({}, { each: true })
  @IsOptional()
  recipientEmails?: string[];

  @ApiProperty({ example: 'We value your feedback!', description: 'Email subject line' })
  @IsString()
  @MaxLength(255)
  emailSubject: string;

  @ApiProperty({ description: 'Email body content' })
  @IsString()
  @MaxLength(10000)
  emailBody: string;

  @ApiPropertyOptional({ example: 'Your Company', description: 'Sender name' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  senderName?: string;

  @ApiPropertyOptional({ example: 'noreply@company.com', description: 'Sender email' })
  @IsEmail()
  @IsOptional()
  senderEmail?: string;

  @ApiPropertyOptional({ example: 'support@company.com', description: 'Reply-to email' })
  @IsEmail()
  @IsOptional()
  replyTo?: string;

  @ApiPropertyOptional({ description: 'Schedule send time' })
  @IsDateString()
  @IsOptional()
  scheduleAt?: string;

  @ApiPropertyOptional({ description: 'Enable reminder emails' })
  @IsBoolean()
  @IsOptional()
  reminderEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Days to wait before sending reminder' })
  @IsOptional()
  reminderDelayDays?: number;
}
