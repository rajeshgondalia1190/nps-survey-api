import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkActionDto {
  @ApiProperty({ description: 'Array of customer IDs' })
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}
