import { IsString, IsEnum, IsOptional, IsNumber, MaxLength, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WidgetType, WidgetTrigger } from '../entities/distribution-campaign.entity';

export class CreateWidgetCampaignDto {
  @ApiProperty({ description: 'Campaign name' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Survey ID to distribute' })
  @IsString()
  surveyId: string;

  @ApiProperty({ enum: WidgetType, description: 'Widget display type' })
  @IsEnum(WidgetType)
  widgetType: WidgetType;

  @ApiProperty({ enum: WidgetTrigger, description: 'Widget trigger event' })
  @IsEnum(WidgetTrigger)
  widgetTrigger: WidgetTrigger;

  @ApiPropertyOptional({ description: 'Delay in seconds for delay trigger' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(300)
  widgetDelaySeconds?: number;

  @ApiPropertyOptional({ description: 'Scroll percentage for scroll trigger' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  widgetScrollPercentage?: number;
}
