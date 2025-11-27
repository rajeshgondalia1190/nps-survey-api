import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  IsObject,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ example: 'John Doe', description: 'Customer name' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'john@company.com', description: 'Customer email' })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiPropertyOptional({ example: 'Acme Inc', description: 'Customer company' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  company?: string;

  @ApiPropertyOptional({ example: '+1234567890', description: 'Customer phone' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ example: ['enterprise', 'vip'], description: 'Customer tags' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Custom fields as key-value pairs' })
  @IsObject()
  @IsOptional()
  customFields?: Record<string, any>;

  @ApiPropertyOptional({ description: 'External ID from your system' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  externalId?: string;
}
