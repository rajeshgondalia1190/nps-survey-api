import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { TeamMember } from './team-member.entity';
import { Survey } from '../../surveys/entities/survey.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { DistributionCampaign } from '../../distribution/entities/distribution-campaign.entity';

export enum Industry {
  TECHNOLOGY = 'technology',
  FINANCE = 'finance',
  HEALTHCARE = 'healthcare',
  RETAIL = 'retail',
  EDUCATION = 'education',
  MANUFACTURING = 'manufacturing',
  OTHER = 'other',
}

export enum CompanySize {
  SOLO = '1-10',
  SMALL = '11-50',
  MEDIUM = '51-200',
  LARGE = '201-500',
  ENTERPRISE = '500+',
}

export enum Plan {
  TRIAL = 'trial',
  STARTER = 'starter',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

@Entity('organizations')
export class Organization extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({
    type: 'enum',
    enum: Industry,
    default: Industry.OTHER,
  })
  industry: Industry;

  @Column({
    name: 'company_size',
    type: 'enum',
    enum: CompanySize,
    default: CompanySize.SMALL,
  })
  companySize: CompanySize;

  @Column({ type: 'varchar', nullable: true, length: 500 })
  website: string | null;

  @Column({ type: 'varchar', nullable: true, length: 500 })
  logo: string | null;

  @Column({ type: 'varchar', default: 'UTC', length: 50 })
  timezone: string;

  @Column({ type: 'varchar', default: 'en', length: 10 })
  language: string;

  @Column({ name: 'primary_color', type: 'varchar', default: '#6366f1', length: 7 })
  primaryColor: string;

  @Column({ name: 'background_color', type: 'varchar', default: '#ffffff', length: 7 })
  backgroundColor: string;

  @Column({ name: 'custom_css', type: 'text', nullable: true })
  customCSS: string | null;

  @Column({
    type: 'enum',
    enum: Plan,
    default: Plan.TRIAL,
  })
  plan: Plan;

  @Column({ name: 'plan_expires_at', type: 'timestamp', nullable: true })
  planExpiresAt: Date | null;

  @Column({ name: 'surveys_limit', type: 'int', default: 10 })
  surveysLimit: number;

  @Column({ name: 'responses_limit', type: 'int', default: 1000 })
  responsesLimit: number;

  @Column({ name: 'team_members_limit', type: 'int', default: 3 })
  teamMembersLimit: number;

  // Relations
  @OneToMany(() => TeamMember, (teamMember) => teamMember.organization)
  teamMembers: TeamMember[];

  @OneToMany(() => Survey, (survey) => survey.organization)
  surveys: Survey[];

  @OneToMany(() => Customer, (customer) => customer.organization)
  customers: Customer[];

  @OneToMany(() => DistributionCampaign, (campaign) => campaign.organization)
  distributionCampaigns: DistributionCampaign[];
}
