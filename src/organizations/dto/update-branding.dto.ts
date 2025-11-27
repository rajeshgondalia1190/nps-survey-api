import { IsString, IsOptional, Matches, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBrandingDto {
  @ApiPropertyOptional({ example: '#6366f1', description: 'Primary brand color (hex)' })
  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Primary color must be a valid hex color' })
  primaryColor?: string;

  @ApiPropertyOptional({ example: '#ffffff', description: 'Background color (hex)' })
  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Background color must be a valid hex color' })
  backgroundColor?: string;

  @ApiPropertyOptional({ description: 'Custom CSS for surveys' })
  @IsString()
  @IsOptional()
  @MaxLength(10000)
  customCSS?: string;
}
