import { Entity, Column, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Survey } from '../../surveys/entities/survey.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { DistributionCampaign } from '../../distribution/entities/distribution-campaign.entity';
import { Answer } from './answer.entity';
import { CustomerSegment } from '../../customers/entities/customer.entity';

export enum ResponseStatus {
  STARTED = 'started',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
}

@Entity('survey_responses')
@Index(['surveyId', 'createdAt'])
@Index(['customerId'])
export class SurveyResponse extends BaseEntity {
  @Column({ name: 'survey_id', type: 'uuid' })
  surveyId: string;

  @ManyToOne(() => Survey, (survey) => survey.responses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'survey_id' })
  survey: Survey;

  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId: string | null;

  @ManyToOne(() => Customer, (customer) => customer.responses, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'distribution_id', type: 'uuid', nullable: true })
  distributionId: string | null;

  @ManyToOne(() => DistributionCampaign, (campaign) => campaign.responses, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'distribution_id' })
  distribution: DistributionCampaign;

  @Column({ name: 'nps_score', type: 'int', nullable: true })
  npsScore: number | null;

  @Column({
    type: 'enum',
    enum: CustomerSegment,
    nullable: true,
  })
  segment: CustomerSegment | null;

  @Column({
    type: 'enum',
    enum: ResponseStatus,
    default: ResponseStatus.STARTED,
  })
  status: ResponseStatus;

  @Column({ type: 'text', nullable: true })
  feedback: string | null;

  @Column({ type: 'boolean', default: false })
  flagged: boolean;

  @Column({ name: 'flag_reason', type: 'varchar', nullable: true, length: 500 })
  flagReason: string | null;

  @Column({ name: 'respondent_email', type: 'varchar', nullable: true, length: 255 })
  respondentEmail: string | null;

  @Column({ name: 'respondent_name', type: 'varchar', nullable: true, length: 255 })
  respondentName: string | null;

  @Column({ name: 'ip_address', type: 'varchar', nullable: true, length: 45 })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'varchar', nullable: true, length: 500 })
  userAgent: string | null;

  @Column({ name: 'completion_time_seconds', type: 'int', nullable: true })
  completionTimeSeconds: number | null;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  // Relations
  @OneToMany(() => Answer, (answer) => answer.response, { cascade: true })
  answers: Answer[];
}
