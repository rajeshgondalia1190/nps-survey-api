import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuestionType } from '../entities/question.entity';

export class CreateQuestionDto {
  @ApiProperty({ enum: QuestionType, description: 'Question type' })
  @IsEnum(QuestionType)
  type: QuestionType;

  @ApiProperty({ example: 'How satisfied are you?', description: 'Question title' })
  @IsString()
  @MaxLength(1000)
  title: string;

  @ApiPropertyOptional({ description: 'Question description/help text' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ description: 'Question order (0-based)' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  order?: number;

  @ApiPropertyOptional({ description: 'Is this question required?' })
  @IsBoolean()
  @IsOptional()
  required?: boolean;

  @ApiPropertyOptional({ example: ['Option 1', 'Option 2'], description: 'Options for multiple choice' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  options?: string[];

  @ApiPropertyOptional({ example: 0, description: 'Minimum value for rating/NPS' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  minValue?: number;

  @ApiPropertyOptional({ example: 10, description: 'Maximum value for rating/NPS' })
  @IsNumber()
  @IsOptional()
  @Max(100)
  maxValue?: number;

  @ApiPropertyOptional({ example: 'Not at all likely', description: 'Label for minimum value' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  minLabel?: string;

  @ApiPropertyOptional({ example: 'Extremely likely', description: 'Label for maximum value' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  maxLabel?: string;

  @ApiPropertyOptional({ description: 'Placeholder text for text inputs' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  placeholder?: string;

  @ApiPropertyOptional({ description: 'Allow "Other" option for multiple choice' })
  @IsBoolean()
  @IsOptional()
  allowOther?: boolean;
}
