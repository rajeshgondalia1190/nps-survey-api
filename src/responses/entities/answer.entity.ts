import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { SurveyResponse } from './survey-response.entity';
import { Question } from '../../surveys/entities/question.entity';

@Entity('answers')
@Index(['responseId', 'questionId'])
export class Answer extends BaseEntity {
  @Column({ name: 'response_id', type: 'uuid' })
  responseId: string;

  @ManyToOne(() => SurveyResponse, (response) => response.answers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'response_id' })
  response: SurveyResponse;

  @Column({ name: 'question_id', type: 'uuid' })
  questionId: string;

  @ManyToOne(() => Question, (question) => question.answers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @Column({ type: 'text', nullable: true })
  value: string | null;

  @Column({ name: 'numeric_value', type: 'decimal', precision: 10, scale: 2, nullable: true })
  numericValue: number | null;

  @Column({ name: 'selected_options', type: 'simple-array', nullable: true })
  selectedOptions: string[] | null;

  @Column({ name: 'other_value', type: 'varchar', nullable: true, length: 500 })
  otherValue: string | null;
}
