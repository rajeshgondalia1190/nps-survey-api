import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurveysService } from './surveys.service';
import { SurveysController } from './surveys.controller';
import { PublicSurveyController } from './public-survey.controller';
import { Survey } from './entities/survey.entity';
import { Question } from './entities/question.entity';
import { SurveyResponse } from '../responses/entities/survey-response.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Survey, Question, SurveyResponse])],
  controllers: [SurveysController, PublicSurveyController],
  providers: [SurveysService],
  exports: [SurveysService],
})
export class SurveysModule {}
