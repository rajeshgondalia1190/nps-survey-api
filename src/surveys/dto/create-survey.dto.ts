import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SurveyType } from '../entities/survey.entity';

export class CreateSurveyDto {
  @ApiProperty({ example: 'Customer Satisfaction Survey', description: 'Survey title' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: 'Survey description' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: SurveyType, default: SurveyType.NPS })
  @IsEnum(SurveyType)
  @IsOptional()
  type?: SurveyType;

  @ApiPropertyOptional({ example: 100, description: 'Target number of responses' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(1000000)
  targetResponses?: number;

  @ApiPropertyOptional({ description: 'Allow anonymous responses' })
  @IsBoolean()
  @IsOptional()
  anonymousResponses?: boolean;

  @ApiPropertyOptional({ description: 'Show progress bar to respondents' })
  @IsBoolean()
  @IsOptional()
  showProgressBar?: boolean;

  @ApiPropertyOptional({ description: 'Send reminder emails' })
  @IsBoolean()
  @IsOptional()
  sendReminders?: boolean;

  @ApiPropertyOptional({ description: 'Thank you message after completion' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  thankYouMessage?: string;

  @ApiPropertyOptional({ description: 'Survey logo URL' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  logo?: string;

  @ApiPropertyOptional({ example: '#6366f1', description: 'Primary color for survey' })
  @IsString()
  @IsOptional()
  @MaxLength(7)
  primaryColor?: string;
}
