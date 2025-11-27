import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Organization } from './organization.entity';

export enum TeamRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  ANALYST = 'analyst',
  VIEWER = 'viewer',
}

@Entity('team_members')
@Unique(['userId', 'organizationId'])
export class TeamMember extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.teamMemberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @ManyToOne(() => Organization, (org) => org.teamMembers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({
    type: 'enum',
    enum: TeamRole,
    default: TeamRole.VIEWER,
  })
  role: TeamRole;

  @Column({ name: 'invite_token', type: 'varchar', nullable: true, length: 255 })
  inviteToken: string | null;

  @Column({ name: 'invite_email', type: 'varchar', nullable: true, length: 255 })
  inviteEmail: string | null;

  @Column({ name: 'invite_accepted_at', type: 'timestamp', nullable: true })
  inviteAcceptedAt: Date | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
