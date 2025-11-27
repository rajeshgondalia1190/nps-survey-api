import { IsOptional, IsEnum, IsString, IsNumber, IsBoolean, IsDateString, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { CustomerSegment } from '../../customers/entities/customer.entity';

export class ResponseQueryDto {
  @ApiPropertyOptional({ description: 'Filter by survey ID' })
  @IsString()
  @IsOptional()
  surveyId?: string;

  @ApiPropertyOptional({ enum: CustomerSegment, description: 'Filter by segment' })
  @IsEnum(CustomerSegment)
  @IsOptional()
  segment?: CustomerSegment;

  @ApiPropertyOptional({ description: 'Search in feedback, email, name' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter flagged responses' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  flagged?: boolean;

  @ApiPropertyOptional({ description: 'Filter by start date' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter by end date' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

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
