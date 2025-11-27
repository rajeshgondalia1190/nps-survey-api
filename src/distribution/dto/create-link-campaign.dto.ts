import { IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLinkCampaignDto {
  @ApiProperty({ description: 'Campaign name' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Survey ID to distribute' })
  @IsString()
  surveyId: string;
}
