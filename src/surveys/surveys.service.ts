import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Survey, SurveyStatus, SurveyType } from './entities/survey.entity';
import { Question, QuestionType } from './entities/question.entity';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { UpdateSurveyDto } from './dto/update-survey.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { SurveyQueryDto } from './dto/survey-query.dto';

@Injectable()
export class SurveysService {
  constructor(
    @InjectRepository(Survey)
    private surveysRepository: Repository<Survey>,
    @InjectRepository(Question)
    private questionsRepository: Repository<Question>,
  ) {}

  async create(organizationId: string, userId: string, createDto: CreateSurveyDto): Promise<Survey> {
    const shareCode = this.generateShareCode();

    const survey = this.surveysRepository.create({
      ...createDto,
      organizationId,
      createdById: userId,
      shareCode,
      status: SurveyStatus.DRAFT,
    });

    const savedSurvey = await this.surveysRepository.save(survey);

    // Create default NPS question if survey type is NPS
    if (createDto.type === SurveyType.NPS || !createDto.type) {
      const npsQuestion = this.questionsRepository.create({
        surveyId: savedSurvey.id,
        type: QuestionType.NPS,
        title: 'How likely are you to recommend us to a friend or colleague?',
        required: true,
        order: 0,
        minValue: 0,
        maxValue: 10,
        minLabel: 'Not at all likely',
        maxLabel: 'Extremely likely',
      });
      await this.questionsRepository.save(npsQuestion);

      // Add follow-up question
      const followUpQuestion = this.questionsRepository.create({
        surveyId: savedSurvey.id,
        type: QuestionType.TEXTAREA,
        title: 'What is the primary reason for your score?',
        required: false,
        order: 1,
        placeholder: 'Please share your feedback...',
      });
      await this.questionsRepository.save(followUpQuestion);
    }

    return this.findById(savedSurvey.id, organizationId);
  }

  async findAll(organizationId: string, query: SurveyQueryDto): Promise<{ surveys: Survey[]; total: number }> {
    const { status, search, sortBy = 'createdAt', sortOrder = 'DESC', page = 1, limit = 10 } = query;

    const queryBuilder = this.surveysRepository
      .createQueryBuilder('survey')
      .where('survey.organizationId = :organizationId', { organizationId })
      .leftJoinAndSelect('survey.questions', 'questions')
      .orderBy('questions.order', 'ASC');

    if (status) {
      queryBuilder.andWhere('survey.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere('(survey.title ILIKE :search OR survey.description ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    queryBuilder.orderBy(`survey.${sortBy}`, sortOrder as 'ASC' | 'DESC');
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [surveys, total] = await queryBuilder.getManyAndCount();

    return { surveys, total };
  }

  async findById(id: string, organizationId: string): Promise<Survey> {
    const survey = await this.surveysRepository.findOne({
      where: { id, organizationId },
      relations: ['questions', 'createdBy'],
      order: { questions: { order: 'ASC' } },
    });

    if (!survey) {
      throw new NotFoundException('Survey not found');
    }

    return survey;
  }

  async findByShareCode(shareCode: string): Promise<Survey> {
    const survey = await this.surveysRepository.findOne({
      where: { shareCode },
      relations: ['questions', 'organization'],
      order: { questions: { order: 'ASC' } },
    });

    if (!survey) {
      throw new NotFoundException('Survey not found');
    }

    if (survey.status !== SurveyStatus.ACTIVE) {
      throw new BadRequestException('This survey is not currently accepting responses');
    }

    return survey;
  }

  async update(id: string, organizationId: string, updateDto: UpdateSurveyDto): Promise<Survey> {
    const survey = await this.findById(id, organizationId);

    if (survey.status === SurveyStatus.CLOSED) {
      throw new BadRequestException('Cannot modify a closed survey');
    }

    Object.assign(survey, updateDto);
    await this.surveysRepository.save(survey);

    return this.findById(id, organizationId);
  }

  async publish(id: string, organizationId: string): Promise<Survey> {
    const survey = await this.findById(id, organizationId);

    if (survey.status !== SurveyStatus.DRAFT && survey.status !== SurveyStatus.PAUSED) {
      throw new BadRequestException('Survey must be in draft or paused status to publish');
    }

    // Validate survey has at least one question
    if (!survey.questions || survey.questions.length === 0) {
      throw new BadRequestException('Survey must have at least one question');
    }

    survey.status = SurveyStatus.ACTIVE;
    survey.publishedAt = new Date();
    await this.surveysRepository.save(survey);

    return this.findById(id, organizationId);
  }

  async pause(id: string, organizationId: string): Promise<Survey> {
    const survey = await this.findById(id, organizationId);

    if (survey.status !== SurveyStatus.ACTIVE) {
      throw new BadRequestException('Only active surveys can be paused');
    }

    survey.status = SurveyStatus.PAUSED;
    await this.surveysRepository.save(survey);

    return this.findById(id, organizationId);
  }

  async close(id: string, organizationId: string): Promise<Survey> {
    const survey = await this.findById(id, organizationId);

    if (survey.status === SurveyStatus.CLOSED) {
      throw new BadRequestException('Survey is already closed');
    }

    survey.status = SurveyStatus.CLOSED;
    survey.closedAt = new Date();
    await this.surveysRepository.save(survey);

    return this.findById(id, organizationId);
  }

  async duplicate(id: string, organizationId: string, userId: string): Promise<Survey> {
    const original = await this.findById(id, organizationId);

    const newSurvey = this.surveysRepository.create({
      title: `${original.title} (Copy)`,
      description: original.description,
      type: original.type,
      organizationId,
      createdById: userId,
      shareCode: this.generateShareCode(),
      status: SurveyStatus.DRAFT,
      targetResponses: original.targetResponses,
      anonymousResponses: original.anonymousResponses,
      showProgressBar: original.showProgressBar,
      sendReminders: original.sendReminders,
      thankYouMessage: original.thankYouMessage,
      logo: original.logo,
      primaryColor: original.primaryColor,
    });

    const savedSurvey = await this.surveysRepository.save(newSurvey);

    // Duplicate questions
    for (const question of original.questions) {
      const newQuestion = this.questionsRepository.create({
        surveyId: savedSurvey.id,
        type: question.type,
        title: question.title,
        description: question.description,
        order: question.order,
        required: question.required,
        options: question.options,
        minValue: question.minValue,
        maxValue: question.maxValue,
        minLabel: question.minLabel,
        maxLabel: question.maxLabel,
        placeholder: question.placeholder,
        allowOther: question.allowOther,
        conditionalLogic: question.conditionalLogic,
      });
      await this.questionsRepository.save(newQuestion);
    }

    return this.findById(savedSurvey.id, organizationId);
  }

  async delete(id: string, organizationId: string): Promise<void> {
    const survey = await this.findById(id, organizationId);
    await this.surveysRepository.remove(survey);
  }

  // Question management
  async addQuestion(surveyId: string, organizationId: string, createDto: CreateQuestionDto): Promise<Question> {
    const survey = await this.findById(surveyId, organizationId);

    if (survey.status === SurveyStatus.ACTIVE || survey.status === SurveyStatus.CLOSED) {
      throw new BadRequestException('Cannot add questions to an active or closed survey');
    }

    // Get max order
    const maxOrder = survey.questions.reduce((max, q) => Math.max(max, q.order), -1);

    const question = this.questionsRepository.create({
      ...createDto,
      surveyId,
      order: createDto.order ?? maxOrder + 1,
    });

    return this.questionsRepository.save(question);
  }

  async updateQuestion(
    surveyId: string,
    questionId: string,
    organizationId: string,
    updateDto: Partial<CreateQuestionDto>,
  ): Promise<Question> {
    const survey = await this.findById(surveyId, organizationId);

    if (survey.status === SurveyStatus.ACTIVE || survey.status === SurveyStatus.CLOSED) {
      throw new BadRequestException('Cannot modify questions of an active or closed survey');
    }

    const question = await this.questionsRepository.findOne({
      where: { id: questionId, surveyId },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    Object.assign(question, updateDto);
    return this.questionsRepository.save(question);
  }

  async deleteQuestion(surveyId: string, questionId: string, organizationId: string): Promise<void> {
    const survey = await this.findById(surveyId, organizationId);

    if (survey.status === SurveyStatus.ACTIVE || survey.status === SurveyStatus.CLOSED) {
      throw new BadRequestException('Cannot delete questions from an active or closed survey');
    }

    if (survey.questions.length <= 1) {
      throw new BadRequestException('Survey must have at least one question');
    }

    const question = await this.questionsRepository.findOne({
      where: { id: questionId, surveyId },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    await this.questionsRepository.remove(question);
  }

  async reorderQuestions(surveyId: string, organizationId: string, questionIds: string[]): Promise<void> {
    const survey = await this.findById(surveyId, organizationId);

    if (survey.status === SurveyStatus.ACTIVE || survey.status === SurveyStatus.CLOSED) {
      throw new BadRequestException('Cannot reorder questions of an active or closed survey');
    }

    for (let i = 0; i < questionIds.length; i++) {
      await this.questionsRepository.update(
        { id: questionIds[i], surveyId },
        { order: i },
      );
    }
  }

  // Stats
  async getStats(surveyId: string, organizationId: string): Promise<{
    totalResponses: number;
    npsScore: number;
    promoters: number;
    passives: number;
    detractors: number;
    responseRate: number;
  }> {
    const survey = await this.findById(surveyId, organizationId);

    return {
      totalResponses: survey.responseCount,
      npsScore: survey.npsScore || 0,
      promoters: survey.promotersCount,
      passives: survey.passivesCount,
      detractors: survey.detractorsCount,
      responseRate: survey.targetResponses > 0
        ? (survey.responseCount / survey.targetResponses) * 100
        : 0,
    };
  }

  private generateShareCode(): string {
    return uuidv4().replace(/-/g, '').substring(0, 12);
  }
}
