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
import { SurveysService } from './surveys.service';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { UpdateSurveyDto } from './dto/update-survey.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { SurveyQueryDto } from './dto/survey-query.dto';
import { ReorderQuestionsDto } from './dto/reorder-questions.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('surveys')
@Controller('surveys')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SurveysController {
  constructor(private readonly surveysService: SurveysService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new survey' })
  @ApiResponse({ status: 201, description: 'Survey created' })
  async create(
    @CurrentUser('id') userId: string,
    @CurrentUser('organizationId') organizationId: string,
    @Body() createDto: CreateSurveyDto,
  ) {
    const survey = await this.surveysService.create(organizationId, userId, createDto);
    return { survey, message: 'Survey created successfully' };
  }

  @Get()
  @ApiOperation({ summary: 'Get all surveys' })
  @ApiResponse({ status: 200, description: 'Surveys retrieved' })
  async findAll(
    @CurrentUser('organizationId') organizationId: string,
    @Query() query: SurveyQueryDto,
  ) {
    const { surveys, total } = await this.surveysService.findAll(organizationId, query);
    return {
      surveys,
      total,
      page: query.page || 1,
      limit: query.limit || 10,
      totalPages: Math.ceil(total / (query.limit || 10)),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get survey by ID' })
  @ApiResponse({ status: 200, description: 'Survey retrieved' })
  @ApiResponse({ status: 404, description: 'Survey not found' })
  async findOne(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    const survey = await this.surveysService.findById(id, organizationId);
    return { survey };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update survey' })
  @ApiResponse({ status: 200, description: 'Survey updated' })
  async update(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateSurveyDto,
  ) {
    const survey = await this.surveysService.update(id, organizationId, updateDto);
    return { survey, message: 'Survey updated successfully' };
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish survey' })
  @ApiResponse({ status: 200, description: 'Survey published' })
  async publish(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    const survey = await this.surveysService.publish(id, organizationId);
    return { survey, message: 'Survey published successfully' };
  }

  @Post(':id/pause')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pause survey' })
  @ApiResponse({ status: 200, description: 'Survey paused' })
  async pause(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    const survey = await this.surveysService.pause(id, organizationId);
    return { survey, message: 'Survey paused successfully' };
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Close survey' })
  @ApiResponse({ status: 200, description: 'Survey closed' })
  async close(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    const survey = await this.surveysService.close(id, organizationId);
    return { survey, message: 'Survey closed successfully' };
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate survey' })
  @ApiResponse({ status: 201, description: 'Survey duplicated' })
  async duplicate(
    @CurrentUser('id') userId: string,
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    const survey = await this.surveysService.duplicate(id, organizationId, userId);
    return { survey, message: 'Survey duplicated successfully' };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete survey' })
  @ApiResponse({ status: 204, description: 'Survey deleted' })
  async delete(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    await this.surveysService.delete(id, organizationId);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get survey statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getStats(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    const stats = await this.surveysService.getStats(id, organizationId);
    return { stats };
  }

  // Question endpoints
  @Post(':id/questions')
  @ApiOperation({ summary: 'Add question to survey' })
  @ApiResponse({ status: 201, description: 'Question added' })
  async addQuestion(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
    @Body() createDto: CreateQuestionDto,
  ) {
    const question = await this.surveysService.addQuestion(id, organizationId, createDto);
    return { question, message: 'Question added successfully' };
  }

  @Patch(':id/questions/:questionId')
  @ApiOperation({ summary: 'Update question' })
  @ApiResponse({ status: 200, description: 'Question updated' })
  async updateQuestion(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
    @Param('questionId') questionId: string,
    @Body() updateDto: Partial<CreateQuestionDto>,
  ) {
    const question = await this.surveysService.updateQuestion(id, questionId, organizationId, updateDto);
    return { question, message: 'Question updated successfully' };
  }

  @Delete(':id/questions/:questionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete question' })
  @ApiResponse({ status: 204, description: 'Question deleted' })
  async deleteQuestion(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
    @Param('questionId') questionId: string,
  ) {
    await this.surveysService.deleteQuestion(id, questionId, organizationId);
  }

  @Post(':id/questions/reorder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reorder questions' })
  @ApiResponse({ status: 200, description: 'Questions reordered' })
  async reorderQuestions(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
    @Body() reorderDto: ReorderQuestionsDto,
  ) {
    await this.surveysService.reorderQuestions(id, organizationId, reorderDto.questionIds);
    return { message: 'Questions reordered successfully' };
  }
}
