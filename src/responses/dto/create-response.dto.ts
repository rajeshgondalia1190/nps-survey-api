import {
  IsString,
  IsOptional,
  IsNumber,
  IsEmail,
  IsArray,
  ValidateNested,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAnswerDto {
  @ApiProperty({ description: 'Question ID' })
  @IsString()
  questionId: string;

  @ApiPropertyOptional({ description: 'Text value for the answer' })
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  value?: string;

  @ApiPropertyOptional({ description: 'Numeric value for rating/NPS questions' })
  @IsNumber()
  @IsOptional()
  numericValue?: number;

  @ApiPropertyOptional({ description: 'Selected options for multiple choice questions' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  selectedOptions?: string[];

  @ApiPropertyOptional({ description: 'Other/custom value' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  otherValue?: string;
}

export class CreateResponseDto {
  @ApiPropertyOptional({ description: 'Customer ID if known' })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ example: 'john@example.com', description: 'Respondent email' })
  @IsEmail()
  @IsOptional()
  respondentEmail?: string;

  @ApiPropertyOptional({ example: 'John Doe', description: 'Respondent name' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  respondentName?: string;

  @ApiPropertyOptional({ example: 8, description: 'NPS score (0-10)' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(10)
  npsScore?: number;

  @ApiPropertyOptional({ description: 'Open-ended feedback' })
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  feedback?: string;

  @ApiPropertyOptional({ type: [CreateAnswerDto], description: 'Answers to questions' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAnswerDto)
  @IsOptional()
  answers?: CreateAnswerDto[];
}
