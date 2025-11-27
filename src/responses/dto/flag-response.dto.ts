import { IsBoolean, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FlagResponseDto {
  @ApiProperty({ description: 'Flag or unflag the response' })
  @IsBoolean()
  flagged: boolean;

  @ApiPropertyOptional({ description: 'Reason for flagging' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;
}
