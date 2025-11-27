import { Entity, Column, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { User } from '../../users/entities/user.entity';
import { Question } from './question.entity';
import { SurveyResponse } from '../../responses/entities/survey-response.entity';
import { DistributionCampaign } from '../../distribution/entities/distribution-campaign.entity';

export enum SurveyType {
  NPS = 'nps',
  CSAT = 'csat',
  CES = 'ces',
  CUSTOM = 'custom',
}

export enum SurveyStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  CLOSED = 'closed',
}

@Entity('surveys')
@Index(['organizationId', 'status'])
export class Survey extends BaseEntity {
  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @ManyToOne(() => Organization, (org) => org.surveys, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: SurveyType,
    default: SurveyType.NPS,
  })
  type: SurveyType;

  @Column({
    type: 'enum',
    enum: SurveyStatus,
    default: SurveyStatus.DRAFT,
  })
  status: SurveyStatus;

  @Column({ name: 'target_responses', type: 'int', default: 100 })
  targetResponses: number;

  @Column({ name: 'response_count', type: 'int', default: 0 })
  responseCount: number;

  @Column({ name: 'nps_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  npsScore: number | null;

  @Column({ name: 'promoters_count', type: 'int', default: 0 })
  promotersCount: number;

  @Column({ name: 'passives_count', type: 'int', default: 0 })
  passivesCount: number;

  @Column({ name: 'detractors_count', type: 'int', default: 0 })
  detractorsCount: number;

  @Column({ name: 'anonymous_responses', type: 'boolean', default: false })
  anonymousResponses: boolean;

  @Column({ name: 'show_progress_bar', type: 'boolean', default: true })
  showProgressBar: boolean;

  @Column({ name: 'send_reminders', type: 'boolean', default: true })
  sendReminders: boolean;

  @Column({ name: 'thank_you_message', type: 'text', nullable: true })
  thankYouMessage: string | null;

  @Column({ type: 'varchar', nullable: true, length: 500 })
  logo: string | null;

  @Column({ name: 'primary_color', type: 'varchar', nullable: true, length: 7 })
  primaryColor: string | null;

  @Column({ name: 'share_code', type: 'varchar', unique: true, length: 50 })
  shareCode: string;

  @Column({ name: 'created_by', type: 'uuid' })
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column({ name: 'published_at', type: 'timestamp', nullable: true })
  publishedAt: Date | null;

  @Column({ name: 'closed_at', type: 'timestamp', nullable: true })
  closedAt: Date | null;

  @Column({ name: 'starts_at', type: 'timestamp', nullable: true })
  startsAt: Date | null;

  @Column({ name: 'ends_at', type: 'timestamp', nullable: true })
  endsAt: Date | null;

  // Relations
  @OneToMany(() => Question, (question) => question.survey, { cascade: true })
  questions: Question[];

  @OneToMany(() => SurveyResponse, (response) => response.survey)
  responses: SurveyResponse[];

  @OneToMany(() => DistributionCampaign, (campaign) => campaign.survey)
  distributionCampaigns: DistributionCampaign[];

  // Computed property
  get responseRate(): number {
    if (this.targetResponses === 0) return 0;
    return (this.responseCount / this.targetResponses) * 100;
  }
}
