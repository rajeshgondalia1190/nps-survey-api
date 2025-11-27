import { Controller, Post, Param, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { ResponsesService } from './responses.service';
import { SubmitPublicResponseDto } from './dto/submit-public-response.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('public-responses')
@Controller('s')
export class PublicResponseController {
  constructor(private readonly responsesService: ResponsesService) {}

  @Post(':shareCode/respond')
  @Public()
  @ApiOperation({ summary: 'Submit a survey response (public)' })
  @ApiResponse({ status: 201, description: 'Response submitted successfully' })
  @ApiResponse({ status: 400, description: 'Survey not accepting responses' })
  @ApiResponse({ status: 404, description: 'Survey not found' })
  async submitResponse(
    @Param('shareCode') shareCode: string,
    @Body() submitDto: SubmitPublicResponseDto,
    @Req() request: Request,
  ) {
    const metadata = {
      ipAddress: request.ip || request.headers['x-forwarded-for']?.toString(),
      userAgent: request.headers['user-agent'],
    };

    const response = await this.responsesService.submitPublicResponse(
      shareCode,
      submitDto,
      metadata,
    );

    return {
      message: 'Thank you for your feedback!',
      responseId: response.id,
    };
  }
}
