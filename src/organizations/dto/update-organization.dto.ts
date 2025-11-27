import { IsString, IsOptional, IsEnum, MaxLength, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Industry, CompanySize } from '../entities/organization.entity';

export class UpdateOrganizationDto {
  @ApiPropertyOptional({ example: 'Acme Inc', description: 'Organization name' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ enum: Industry, description: 'Industry type' })
  @IsEnum(Industry)
  @IsOptional()
  industry?: Industry;

  @ApiPropertyOptional({ enum: CompanySize, description: 'Company size' })
  @IsEnum(CompanySize)
  @IsOptional()
  companySize?: CompanySize;

  @ApiPropertyOptional({ example: 'https://example.com', description: 'Company website' })
  @IsUrl()
  @IsOptional()
  @MaxLength(500)
  website?: string;

  @ApiPropertyOptional({ example: 'America/New_York', description: 'Timezone' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  timezone?: string;

  @ApiPropertyOptional({ example: 'en', description: 'Preferred language' })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  language?: string;
}
