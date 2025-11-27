import { Entity, Column, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { Survey } from '../../surveys/entities/survey.entity';
import { SurveyResponse } from '../../responses/entities/survey-response.entity';

export enum DistributionType {
  EMAIL = 'email',
  LINK = 'link',
  QR = 'qr',
  WIDGET = 'widget',
  SMS = 'sms',
  API = 'api',
}

export enum DistributionStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  SENDING = 'sending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum WidgetType {
  POPUP = 'popup',
  SLIDE = 'slide',
  INLINE = 'inline',
  BUTTON = 'button',
  BANNER = 'banner',
}

export enum WidgetTrigger {
  DELAY = 'delay',
  SCROLL = 'scroll',
  EXIT = 'exit',
  CLICK = 'click',
  PAGE_LOAD = 'page_load',
}

export enum RecipientSegment {
  ALL = 'all',
  PROMOTERS = 'promoters',
  PASSIVES = 'passives',
  DETRACTORS = 'detractors',
  NO_RESPONSE = 'no_response',
  CUSTOM = 'custom',
}

@Entity('distribution_campaigns')
@Index(['organizationId', 'status'])
@Index(['surveyId'])
export class DistributionCampaign extends BaseEntity {
  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @ManyToOne(() => Organization, (org) => org.distributionCampaigns, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'survey_id', type: 'uuid' })
  surveyId: string;

  @ManyToOne(() => Survey, (survey) => survey.distributionCampaigns, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'survey_id' })
  survey: Survey;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: DistributionType,
    default: DistributionType.EMAIL,
  })
  type: DistributionType;

  @Column({
    type: 'enum',
    enum: DistributionStatus,
    default: DistributionStatus.DRAFT,
  })
  status: DistributionStatus;

  @Column({
    name: 'recipient_segment',
    type: 'enum',
    enum: RecipientSegment,
    default: RecipientSegment.ALL,
  })
  recipientSegment: RecipientSegment;

  @Column({ name: 'recipient_emails', type: 'simple-array', nullable: true })
  recipientEmails: string[] | null;

  @Column({ name: 'recipient_customer_ids', type: 'simple-array', nullable: true })
  recipientCustomerIds: string[] | null;

  // Email specific
  @Column({ name: 'email_subject', type: 'varchar', nullable: true, length: 255 })
  emailSubject: string | null;

  @Column({ name: 'email_body', type: 'text', nullable: true })
  emailBody: string | null;

  @Column({ name: 'sender_name', type: 'varchar', nullable: true, length: 100 })
  senderName: string | null;

  @Column({ name: 'sender_email', type: 'varchar', nullable: true, length: 255 })
  senderEmail: string | null;

  @Column({ name: 'reply_to', type: 'varchar', nullable: true, length: 255 })
  replyTo: string | null;

  // Link/QR specific
  @Column({ type: 'varchar', nullable: true, length: 500 })
  url: string | null;

  @Column({ name: 'short_code', type: 'varchar', nullable: true, length: 20 })
  shortCode: string | null;

  @Column({ name: 'qr_code_url', type: 'varchar', nullable: true, length: 500 })
  qrCodeUrl: string | null;

  // Widget specific
  @Column({
    name: 'widget_type',
    type: 'enum',
    enum: WidgetType,
    nullable: true,
  })
  widgetType: WidgetType | null;

  @Column({
    name: 'widget_trigger',
    type: 'enum',
    enum: WidgetTrigger,
    nullable: true,
  })
  widgetTrigger: WidgetTrigger | null;

  @Column({ name: 'widget_delay_seconds', type: 'int', nullable: true })
  widgetDelaySeconds: number | null;

  @Column({ name: 'widget_scroll_percentage', type: 'int', nullable: true })
  widgetScrollPercentage: number | null;

  @Column({ name: 'embed_code', type: 'text', nullable: true })
  embedCode: string | null;

  // Stats
  @Column({ name: 'sent_count', type: 'int', default: 0 })
  sentCount: number;

  @Column({ name: 'delivered_count', type: 'int', default: 0 })
  deliveredCount: number;

  @Column({ name: 'opened_count', type: 'int', default: 0 })
  openedCount: number;

  @Column({ name: 'clicked_count', type: 'int', default: 0 })
  clickedCount: number;

  @Column({ name: 'responded_count', type: 'int', default: 0 })
  respondedCount: number;

  @Column({ name: 'bounced_count', type: 'int', default: 0 })
  bouncedCount: number;

  @Column({ name: 'unsubscribed_count', type: 'int', default: 0 })
  unsubscribedCount: number;

  // Scheduling
  @Column({ name: 'schedule_at', type: 'timestamp', nullable: true })
  scheduleAt: Date | null;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  // Reminder
  @Column({ name: 'reminder_enabled', type: 'boolean', default: false })
  reminderEnabled: boolean;

  @Column({ name: 'reminder_delay_days', type: 'int', nullable: true })
  reminderDelayDays: number | null;

  @Column({ name: 'reminder_sent_at', type: 'timestamp', nullable: true })
  reminderSentAt: Date | null;

  // Relations
  @OneToMany(() => SurveyResponse, (response) => response.distribution)
  responses: SurveyResponse[];

  // Computed properties
  get openRate(): number {
    if (this.sentCount === 0) return 0;
    return (this.openedCount / this.sentCount) * 100;
  }

  get clickRate(): number {
    if (this.sentCount === 0) return 0;
    return (this.clickedCount / this.sentCount) * 100;
  }

  get responseRate(): number {
    if (this.sentCount === 0) return 0;
    return (this.respondedCount / this.sentCount) * 100;
  }
}
