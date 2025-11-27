import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { SurveyResponse, ResponseStatus } from './entities/survey-response.entity';
import { Answer } from './entities/answer.entity';
import { Survey, SurveyStatus } from '../surveys/entities/survey.entity';
import { Customer, CustomerSegment } from '../customers/entities/customer.entity';
import { Question, QuestionType } from '../surveys/entities/question.entity';
import { CreateResponseDto } from './dto/create-response.dto';
import { ResponseQueryDto } from './dto/response-query.dto';
import { SubmitPublicResponseDto } from './dto/submit-public-response.dto';

@Injectable()
export class ResponsesService {
  constructor(
    @InjectRepository(SurveyResponse)
    private responsesRepository: Repository<SurveyResponse>,
    @InjectRepository(Answer)
    private answersRepository: Repository<Answer>,
    @InjectRepository(Survey)
    private surveysRepository: Repository<Survey>,
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
    @InjectRepository(Question)
    private questionsRepository: Repository<Question>,
  ) {}

  async create(
    surveyId: string,
    organizationId: string,
    createDto: CreateResponseDto,
  ): Promise<SurveyResponse> {
    const survey = await this.surveysRepository.findOne({
      where: { id: surveyId, organizationId },
    });

    if (!survey) {
      throw new NotFoundException('Survey not found');
    }

    const response = this.responsesRepository.create({
      surveyId,
      customerId: createDto.customerId || null,
      respondentEmail: createDto.respondentEmail || null,
      respondentName: createDto.respondentName || null,
      npsScore: createDto.npsScore ?? null,
      segment: this.calculateSegment(createDto.npsScore ?? null),
      feedback: createDto.feedback || null,
      status: ResponseStatus.COMPLETED,
      completedAt: new Date(),
    });

    const savedResponse = await this.responsesRepository.save(response);
    const responseId = Array.isArray(savedResponse) ? savedResponse[0].id : savedResponse.id;

    // Save answers
    if (createDto.answers) {
      for (const answerDto of createDto.answers) {
        const answer = this.answersRepository.create({
          responseId,
          questionId: answerDto.questionId,
          value: answerDto.value,
          numericValue: answerDto.numericValue,
          selectedOptions: answerDto.selectedOptions,
        });
        await this.answersRepository.save(answer);
      }
    }

    // Update survey stats
    await this.updateSurveyStats(surveyId);

    // Update customer segment if applicable
    if (createDto.customerId && createDto.npsScore !== undefined) {
      await this.updateCustomerSegment(createDto.customerId, createDto.npsScore);
    }

    return this.findById(responseId, organizationId);
  }

  async submitPublicResponse(
    shareCode: string,
    submitDto: SubmitPublicResponseDto,
    metadata?: { ipAddress?: string; userAgent?: string },
  ): Promise<SurveyResponse> {
    const survey = await this.surveysRepository.findOne({
      where: { shareCode },
      relations: ['questions'],
    });

    if (!survey) {
      throw new NotFoundException('Survey not found');
    }

    if (survey.status !== SurveyStatus.ACTIVE) {
      throw new BadRequestException('This survey is not currently accepting responses');
    }

    // Find or create customer by email
    let customerId: string | null = null;
    if (submitDto.respondentEmail && !survey.anonymousResponses) {
      let customer = await this.customersRepository.findOne({
        where: { email: submitDto.respondentEmail, organizationId: survey.organizationId },
      });

      if (!customer) {
        customer = this.customersRepository.create({
          organizationId: survey.organizationId,
          email: submitDto.respondentEmail,
          name: submitDto.respondentName || submitDto.respondentEmail.split('@')[0],
        });
        customer = await this.customersRepository.save(customer);
      }
      customerId = customer.id;
    }

    // Extract NPS score from answers
    let npsScore: number | null = null;
    const npsQuestion = survey.questions.find((q) => q.type === QuestionType.NPS);
    if (npsQuestion && submitDto.answers) {
      const npsAnswer = submitDto.answers.find((a) => a.questionId === npsQuestion.id);
      if (npsAnswer && npsAnswer.numericValue !== undefined) {
        npsScore = npsAnswer.numericValue;
      }
    }

    const response = this.responsesRepository.create({
      surveyId: survey.id,
      customerId,
      respondentEmail: survey.anonymousResponses ? null : (submitDto.respondentEmail || null),
      respondentName: survey.anonymousResponses ? null : (submitDto.respondentName || null),
      npsScore,
      segment: npsScore !== null ? this.calculateSegment(npsScore) : null,
      feedback: submitDto.feedback || null,
      status: ResponseStatus.COMPLETED,
      completedAt: new Date(),
      ipAddress: metadata?.ipAddress || null,
      userAgent: metadata?.userAgent || null,
      metadata: submitDto.metadata || null,
    });

    const savedResponse = await this.responsesRepository.save(response);
    const responseId = Array.isArray(savedResponse) ? savedResponse[0].id : savedResponse.id;

    // Save answers
    if (submitDto.answers) {
      for (const answerDto of submitDto.answers) {
        const answer = this.answersRepository.create({
          responseId,
          questionId: answerDto.questionId,
          value: answerDto.value,
          numericValue: answerDto.numericValue,
          selectedOptions: answerDto.selectedOptions,
          otherValue: answerDto.otherValue,
        });
        await this.answersRepository.save(answer);
      }
    }

    // Update survey stats
    await this.updateSurveyStats(survey.id);

    // Update customer segment
    if (customerId && npsScore !== null) {
      await this.updateCustomerSegment(customerId, npsScore);
    }

    const result = Array.isArray(savedResponse) ? savedResponse[0] : savedResponse;
    return result;
  }

  async findAll(
    organizationId: string,
    query: ResponseQueryDto,
  ): Promise<{ responses: SurveyResponse[]; total: number }> {
    const {
      surveyId,
      segment,
      search,
      flagged,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      page = 1,
      limit = 10,
    } = query;

    const queryBuilder = this.responsesRepository
      .createQueryBuilder('response')
      .leftJoinAndSelect('response.survey', 'survey')
      .leftJoinAndSelect('response.customer', 'customer')
      .leftJoinAndSelect('response.answers', 'answers')
      .where('survey.organizationId = :organizationId', { organizationId });

    if (surveyId) {
      queryBuilder.andWhere('response.surveyId = :surveyId', { surveyId });
    }

    if (segment) {
      queryBuilder.andWhere('response.segment = :segment', { segment });
    }

    if (flagged !== undefined) {
      queryBuilder.andWhere('response.flagged = :flagged', { flagged });
    }

    if (search) {
      queryBuilder.andWhere(
        '(response.feedback ILIKE :search OR response.respondentEmail ILIKE :search OR response.respondentName ILIKE :search OR customer.name ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (startDate) {
      queryBuilder.andWhere('response.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('response.createdAt <= :endDate', { endDate });
    }

    queryBuilder.orderBy(`response.${sortBy}`, sortOrder as 'ASC' | 'DESC');
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [responses, total] = await queryBuilder.getManyAndCount();

    return { responses, total };
  }

  async findById(id: string, organizationId: string): Promise<SurveyResponse> {
    const response = await this.responsesRepository
      .createQueryBuilder('response')
      .leftJoinAndSelect('response.survey', 'survey')
      .leftJoinAndSelect('response.customer', 'customer')
      .leftJoinAndSelect('response.answers', 'answers')
      .leftJoinAndSelect('answers.question', 'question')
      .where('response.id = :id', { id })
      .andWhere('survey.organizationId = :organizationId', { organizationId })
      .getOne();

    if (!response) {
      throw new NotFoundException('Response not found');
    }

    return response;
  }

  async findBySurveyId(
    surveyId: string,
    organizationId: string,
    query: ResponseQueryDto,
  ): Promise<{ responses: SurveyResponse[]; total: number }> {
    return this.findAll(organizationId, { ...query, surveyId });
  }

  async flagResponse(id: string, organizationId: string, flagged: boolean, reason?: string): Promise<SurveyResponse> {
    const response = await this.findById(id, organizationId);
    response.flagged = flagged;
    response.flagReason = reason || null;
    await this.responsesRepository.save(response);
    return this.findById(id, organizationId);
  }

  async delete(id: string, organizationId: string): Promise<void> {
    const response = await this.findById(id, organizationId);
    const surveyId = response.surveyId;
    await this.responsesRepository.remove(response);
    await this.updateSurveyStats(surveyId);
  }

  async getResponseStats(organizationId: string, surveyId?: string): Promise<{
    total: number;
    promoters: number;
    passives: number;
    detractors: number;
    npsScore: number;
  }> {
    const queryBuilder = this.responsesRepository
      .createQueryBuilder('response')
      .leftJoin('response.survey', 'survey')
      .where('survey.organizationId = :organizationId', { organizationId })
      .andWhere('response.status = :status', { status: ResponseStatus.COMPLETED });

    if (surveyId) {
      queryBuilder.andWhere('response.surveyId = :surveyId', { surveyId });
    }

    const responses = await queryBuilder.getMany();

    const total = responses.length;
    const promoters = responses.filter((r) => r.segment === CustomerSegment.PROMOTER).length;
    const passives = responses.filter((r) => r.segment === CustomerSegment.PASSIVE).length;
    const detractors = responses.filter((r) => r.segment === CustomerSegment.DETRACTOR).length;

    const npsScore = total > 0
      ? Math.round(((promoters - detractors) / total) * 100)
      : 0;

    return { total, promoters, passives, detractors, npsScore };
  }

  async getRecentResponses(organizationId: string, limit: number = 10): Promise<SurveyResponse[]> {
    return this.responsesRepository
      .createQueryBuilder('response')
      .leftJoinAndSelect('response.survey', 'survey')
      .leftJoinAndSelect('response.customer', 'customer')
      .where('survey.organizationId = :organizationId', { organizationId })
      .orderBy('response.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  private calculateSegment(npsScore: number | null): CustomerSegment | null {
    if (npsScore === null) return null;
    if (npsScore >= 9) return CustomerSegment.PROMOTER;
    if (npsScore >= 7) return CustomerSegment.PASSIVE;
    return CustomerSegment.DETRACTOR;
  }

  private async updateSurveyStats(surveyId: string): Promise<void> {
    const stats = await this.responsesRepository
      .createQueryBuilder('response')
      .select('COUNT(*)', 'total')
      .addSelect('SUM(CASE WHEN response.segment = :promoter THEN 1 ELSE 0 END)', 'promoters')
      .addSelect('SUM(CASE WHEN response.segment = :passive THEN 1 ELSE 0 END)', 'passives')
      .addSelect('SUM(CASE WHEN response.segment = :detractor THEN 1 ELSE 0 END)', 'detractors')
      .where('response.surveyId = :surveyId', { surveyId })
      .andWhere('response.status = :status', { status: ResponseStatus.COMPLETED })
      .setParameters({
        promoter: CustomerSegment.PROMOTER,
        passive: CustomerSegment.PASSIVE,
        detractor: CustomerSegment.DETRACTOR,
      })
      .getRawOne();

    const total = parseInt(stats.total) || 0;
    const promoters = parseInt(stats.promoters) || 0;
    const passives = parseInt(stats.passives) || 0;
    const detractors = parseInt(stats.detractors) || 0;
    const npsScore = total > 0 ? ((promoters - detractors) / total) * 100 : null;

    await this.surveysRepository.update(surveyId, {
      responseCount: total,
      promotersCount: promoters,
      passivesCount: passives,
      detractorsCount: detractors,
      npsScore,
    });
  }

  private async updateCustomerSegment(customerId: string, npsScore: number): Promise<void> {
    const segment = this.calculateSegment(npsScore);
    await this.customersRepository.update(customerId, {
      npsScore,
      segment,
      lastSurveyAt: new Date(),
    });

    // Update total responses count
    const responseCount = await this.responsesRepository.count({
      where: { customerId, status: ResponseStatus.COMPLETED },
    });
    await this.customersRepository.update(customerId, { totalResponses: responseCount });
  }
}
