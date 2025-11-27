import { Entity, Column, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { SurveyResponse } from '../../responses/entities/survey-response.entity';

export enum CustomerSegment {
  PROMOTER = 'promoter',
  PASSIVE = 'passive',
  DETRACTOR = 'detractor',
}

@Entity('customers')
@Index(['organizationId', 'email'], { unique: true })
export class Customer extends BaseEntity {
  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @ManyToOne(() => Organization, (org) => org.customers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', nullable: true, length: 255 })
  company: string | null;

  @Column({ type: 'varchar', nullable: true, length: 50 })
  phone: string | null;

  @Column({
    type: 'enum',
    enum: CustomerSegment,
    nullable: true,
  })
  segment: CustomerSegment | null;

  @Column({ name: 'nps_score', type: 'int', nullable: true })
  npsScore: number | null;

  @Column({ name: 'last_survey_at', type: 'timestamp', nullable: true })
  lastSurveyAt: Date | null;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[] | null;

  @Column({ name: 'custom_fields', type: 'jsonb', nullable: true })
  customFields: Record<string, any> | null;

  @Column({ name: 'total_responses', type: 'int', default: 0 })
  totalResponses: number;

  @Column({ name: 'external_id', type: 'varchar', nullable: true, length: 255 })
  externalId: string | null;

  // Relations
  @OneToMany(() => SurveyResponse, (response) => response.customer)
  responses: SurveyResponse[];
}
