import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ResponsesService } from './responses.service';
import { CreateResponseDto } from './dto/create-response.dto';
import { ResponseQueryDto } from './dto/response-query.dto';
import { FlagResponseDto } from './dto/flag-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('responses')
@Controller('responses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ResponsesController {
  constructor(private readonly responsesService: ResponsesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all responses for organization' })
  @ApiResponse({ status: 200, description: 'Responses retrieved' })
  async findAll(
    @CurrentUser('organizationId') organizationId: string,
    @Query() query: ResponseQueryDto,
  ) {
    const { responses, total } = await this.responsesService.findAll(organizationId, query);
    return {
      responses,
      total,
      page: query.page || 1,
      limit: query.limit || 10,
      totalPages: Math.ceil(total / (query.limit || 10)),
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get response statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getStats(
    @CurrentUser('organizationId') organizationId: string,
    @Query('surveyId') surveyId?: string,
  ) {
    const stats = await this.responsesService.getResponseStats(organizationId, surveyId);
    return { stats };
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent responses' })
  @ApiResponse({ status: 200, description: 'Recent responses retrieved' })
  async getRecent(
    @CurrentUser('organizationId') organizationId: string,
    @Query('limit') limit?: number,
  ) {
    const responses = await this.responsesService.getRecentResponses(organizationId, limit || 10);
    return { responses };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get response by ID' })
  @ApiResponse({ status: 200, description: 'Response retrieved' })
  @ApiResponse({ status: 404, description: 'Response not found' })
  async findOne(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    const response = await this.responsesService.findById(id, organizationId);
    return { response };
  }

  @Post('surveys/:surveyId')
  @ApiOperation({ summary: 'Create a response for a survey (admin)' })
  @ApiResponse({ status: 201, description: 'Response created' })
  async create(
    @CurrentUser('organizationId') organizationId: string,
    @Param('surveyId') surveyId: string,
    @Body() createDto: CreateResponseDto,
  ) {
    const response = await this.responsesService.create(surveyId, organizationId, createDto);
    return { response, message: 'Response created successfully' };
  }

  @Patch(':id/flag')
  @ApiOperation({ summary: 'Flag or unflag a response' })
  @ApiResponse({ status: 200, description: 'Response flagged' })
  async flagResponse(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
    @Body() flagDto: FlagResponseDto,
  ) {
    const response = await this.responsesService.flagResponse(
      id,
      organizationId,
      flagDto.flagged,
      flagDto.reason,
    );
    return { response, message: flagDto.flagged ? 'Response flagged' : 'Response unflagged' };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a response' })
  @ApiResponse({ status: 204, description: 'Response deleted' })
  async delete(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    await this.responsesService.delete(id, organizationId);
  }
}

@ApiTags('responses')
@Controller('surveys/:surveyId/responses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SurveyResponsesController {
  constructor(private readonly responsesService: ResponsesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all responses for a survey' })
  @ApiResponse({ status: 200, description: 'Responses retrieved' })
  async findBySurvey(
    @CurrentUser('organizationId') organizationId: string,
    @Param('surveyId') surveyId: string,
    @Query() query: ResponseQueryDto,
  ) {
    const { responses, total } = await this.responsesService.findBySurveyId(
      surveyId,
      organizationId,
      query,
    );
    return {
      responses,
      total,
      page: query.page || 1,
      limit: query.limit || 10,
      totalPages: Math.ceil(total / (query.limit || 10)),
    };
  }
}
