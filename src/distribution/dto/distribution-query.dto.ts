import { IsOptional, IsEnum, IsString, IsNumber, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DistributionType, DistributionStatus } from '../entities/distribution-campaign.entity';

export class DistributionQueryDto {
  @ApiPropertyOptional({ description: 'Filter by survey ID' })
  @IsString()
  @IsOptional()
  surveyId?: string;

  @ApiPropertyOptional({ enum: DistributionType, description: 'Filter by type' })
  @IsEnum(DistributionType)
  @IsOptional()
  type?: DistributionType;

  @ApiPropertyOptional({ enum: DistributionStatus, description: 'Filter by status' })
  @IsEnum(DistributionStatus)
  @IsOptional()
  status?: DistributionStatus;

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
