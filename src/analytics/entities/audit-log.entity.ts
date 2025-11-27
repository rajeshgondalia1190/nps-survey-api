import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { User } from '../../users/entities/user.entity';

export enum AuditAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  EXPORT = 'export',
  IMPORT = 'import',
  PUBLISH = 'publish',
  CLOSE = 'close',
  SEND = 'send',
}

export enum AuditResourceType {
  USER = 'user',
  ORGANIZATION = 'organization',
  SURVEY = 'survey',
  RESPONSE = 'response',
  CUSTOMER = 'customer',
  DISTRIBUTION = 'distribution',
  TEAM_MEMBER = 'team_member',
  SETTINGS = 'settings',
}

@Entity('audit_logs')
@Index(['organizationId', 'createdAt'])
@Index(['userId'])
@Index(['resourceType', 'resourceId'])
export class AuditLog extends BaseEntity {
  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId: string | null;

  @ManyToOne(() => Organization, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @Column({
    name: 'resource_type',
    type: 'enum',
    enum: AuditResourceType,
  })
  resourceType: AuditResourceType;

  @Column({ name: 'resource_id', type: 'uuid', nullable: true })
  resourceId: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'jsonb', nullable: true })
  changes: Record<string, any> | null;

  @Column({ name: 'previous_values', type: 'jsonb', nullable: true })
  previousValues: Record<string, any> | null;

  @Column({ name: 'new_values', type: 'jsonb', nullable: true })
  newValues: Record<string, any> | null;

  @Column({ name: 'ip_address', type: 'varchar', nullable: true, length: 45 })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'varchar', nullable: true, length: 500 })
  userAgent: string | null;
}
