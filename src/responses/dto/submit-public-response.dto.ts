import {
  IsString,
  IsOptional,
  IsEmail,
  IsArray,
  ValidateNested,
  IsObject,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateAnswerDto } from './create-response.dto';

export class SubmitPublicResponseDto {
  @ApiPropertyOptional({ example: 'john@example.com', description: 'Respondent email' })
  @IsEmail()
  @IsOptional()
  respondentEmail?: string;

  @ApiPropertyOptional({ example: 'John Doe', description: 'Respondent name' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  respondentName?: string;

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

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
