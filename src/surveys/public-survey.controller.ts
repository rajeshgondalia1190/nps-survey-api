import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SurveysService } from './surveys.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('public-surveys')
@Controller('s')
export class PublicSurveyController {
  constructor(private readonly surveysService: SurveysService) {}

  @Get(':shareCode')
  @Public()
  @ApiOperation({ summary: 'Get survey by share code (public)' })
  @ApiResponse({ status: 200, description: 'Survey retrieved' })
  @ApiResponse({ status: 404, description: 'Survey not found' })
  async getSurvey(@Param('shareCode') shareCode: string) {
    const survey = await this.surveysService.findByShareCode(shareCode);

    // Return public-safe survey data
    return {
      survey: {
        id: survey.id,
        title: survey.title,
        description: survey.description,
        type: survey.type,
        questions: survey.questions.map((q) => ({
          id: q.id,
          type: q.type,
          title: q.title,
          description: q.description,
          required: q.required,
          options: q.options,
          minValue: q.minValue,
          maxValue: q.maxValue,
          minLabel: q.minLabel,
          maxLabel: q.maxLabel,
          placeholder: q.placeholder,
          allowOther: q.allowOther,
        })),
        showProgressBar: survey.showProgressBar,
        thankYouMessage: survey.thankYouMessage,
        logo: survey.logo,
        primaryColor: survey.primaryColor,
        branding: {
          primaryColor: survey.organization?.primaryColor,
          backgroundColor: survey.organization?.backgroundColor,
          logo: survey.organization?.logo,
        },
      },
    };
  }
}
