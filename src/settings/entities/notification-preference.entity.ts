import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('notification_preferences')
export class NotificationPreference extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @OneToOne(() => User, (user) => user.notificationPreference, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'new_responses', type: 'boolean', default: true })
  newResponses: boolean;

  @Column({ name: 'nps_alerts', type: 'boolean', default: true })
  npsAlerts: boolean;

  @Column({ name: 'detractor_alerts', type: 'boolean', default: true })
  detractorAlerts: boolean;

  @Column({ name: 'weekly_summary', type: 'boolean', default: true })
  weeklySummary: boolean;

  @Column({ name: 'monthly_report', type: 'boolean', default: true })
  monthlyReport: boolean;

  @Column({ name: 'email_notifications', type: 'boolean', default: true })
  emailNotifications: boolean;

  @Column({ name: 'push_notifications', type: 'boolean', default: false })
  pushNotifications: boolean;

  @Column({ name: 'slack_notifications', type: 'boolean', default: false })
  slackNotifications: boolean;

  @Column({ name: 'slack_webhook_url', type: 'varchar', nullable: true, length: 500 })
  slackWebhookUrl: string | null;
}
