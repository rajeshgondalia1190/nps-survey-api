import { IsArray, IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateCustomerDto } from './create-customer.dto';

export class ImportCustomersDto {
  @ApiProperty({ type: [CreateCustomerDto], description: 'List of customers to import' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCustomerDto)
  customers: CreateCustomerDto[];

  @ApiPropertyOptional({ description: 'Update existing customers if email matches' })
  @IsBoolean()
  @IsOptional()
  updateExisting?: boolean;
}
