import { Entity, Column, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Survey } from './survey.entity';
import { Answer } from '../../responses/entities/answer.entity';

export enum QuestionType {
  NPS = 'nps',
  RATING = 'rating',
  MULTIPLE_CHOICE = 'multiple_choice',
  CHECKBOX = 'checkbox',
  TEXT = 'text',
  TEXTAREA = 'textarea',
  YES_NO = 'yes_no',
  DATE = 'date',
  EMAIL = 'email',
  NUMBER = 'number',
}

@Entity('questions')
@Index(['surveyId', 'order'])
export class Question extends BaseEntity {
  @Column({ name: 'survey_id', type: 'uuid' })
  surveyId: string;

  @ManyToOne(() => Survey, (survey) => survey.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'survey_id' })
  survey: Survey;

  @Column({
    type: 'enum',
    enum: QuestionType,
    default: QuestionType.TEXT,
  })
  type: QuestionType;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'order', type: 'int', default: 0 })
  order: number;

  @Column({ type: 'boolean', default: false })
  required: boolean;

  @Column({ type: 'simple-array', nullable: true })
  options: string[] | null;

  @Column({ name: 'min_value', type: 'int', nullable: true })
  minValue: number | null;

  @Column({ name: 'max_value', type: 'int', nullable: true })
  maxValue: number | null;

  @Column({ name: 'min_label', type: 'varchar', nullable: true, length: 100 })
  minLabel: string | null;

  @Column({ name: 'max_label', type: 'varchar', nullable: true, length: 100 })
  maxLabel: string | null;

  @Column({ type: 'varchar', nullable: true, length: 255 })
  placeholder: string | null;

  @Column({ name: 'allow_other', type: 'boolean', default: false })
  allowOther: boolean;

  @Column({ name: 'conditional_logic', type: 'jsonb', nullable: true })
  conditionalLogic: Record<string, any> | null;

  // Relations
  @OneToMany(() => Answer, (answer) => answer.question)
  answers: Answer[];
}
