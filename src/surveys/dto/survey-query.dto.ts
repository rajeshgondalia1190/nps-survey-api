import { IsOptional, IsEnum, IsString, IsNumber, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { SurveyStatus } from '../entities/survey.entity';

export class SurveyQueryDto {
  @ApiPropertyOptional({ enum: SurveyStatus, description: 'Filter by status' })
  @IsEnum(SurveyStatus)
  @IsOptional()
  status?: SurveyStatus;

  @ApiPropertyOptional({ description: 'Search by title or description' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: 'createdAt', description: 'Sort by field' })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({ example: 'DESC', description: 'Sort order' })
  @IsString()
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC';

  @ApiPropertyOptional({ example: 1, description: 'Page number' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10, description: 'Items per page' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number;
}
