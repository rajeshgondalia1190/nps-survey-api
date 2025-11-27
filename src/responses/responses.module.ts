import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResponsesService } from './responses.service';
import { ResponsesController } from './responses.controller';
import { PublicResponseController } from './public-response.controller';
import { SurveyResponse } from './entities/survey-response.entity';
import { Answer } from './entities/answer.entity';
import { Survey } from '../surveys/entities/survey.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Question } from '../surveys/entities/question.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SurveyResponse, Answer, Survey, Customer, Question])],
  controllers: [ResponsesController, PublicResponseController],
  providers: [ResponsesService],
  exports: [ResponsesService],
})
export class ResponsesModule {}
