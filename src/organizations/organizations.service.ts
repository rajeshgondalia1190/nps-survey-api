import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Organization } from './entities/organization.entity';
import { TeamMember, TeamRole } from './entities/team-member.entity';
import { User } from '../users/entities/user.entity';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { InviteTeamMemberDto } from './dto/invite-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
    @InjectRepository(TeamMember)
    private teamMembersRepository: Repository<TeamMember>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<Organization> {
    const organization = await this.organizationsRepository.findOne({
      where: { id },
      relations: ['owner'],
    });
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }
    return organization;
  }

  async findByUserId(userId: string): Promise<Organization> {
    const teamMember = await this.teamMembersRepository.findOne({
      where: { userId, isActive: true },
      relations: ['organization'],
    });
    if (!teamMember) {
      throw new NotFoundException('Organization not found');
    }
    return teamMember.organization;
  }

  async update(organizationId: string, userId: string, updateDto: UpdateOrganizationDto): Promise<Organization> {
    const organization = await this.findById(organizationId);

    // Check if user has permission
    await this.checkPermission(userId, organizationId, [TeamRole.ADMIN]);

    Object.assign(organization, updateDto);
    return this.organizationsRepository.save(organization);
  }

  async updateBranding(
    organizationId: string,
    userId: string,
    branding: { primaryColor?: string; backgroundColor?: string; customCSS?: string },
  ): Promise<Organization> {
    const organization = await this.findById(organizationId);
    await this.checkPermission(userId, organizationId, [TeamRole.ADMIN]);

    if (branding.primaryColor) organization.primaryColor = branding.primaryColor;
    if (branding.backgroundColor) organization.backgroundColor = branding.backgroundColor;
    if (branding.customCSS !== undefined) organization.customCSS = branding.customCSS;

    return this.organizationsRepository.save(organization);
  }

  // Team Management
  async getTeamMembers(organizationId: string): Promise<TeamMember[]> {
    return this.teamMembersRepository.find({
      where: { organizationId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async inviteTeamMember(
    organizationId: string,
    inviterId: string,
    inviteDto: InviteTeamMemberDto,
  ): Promise<TeamMember> {
    await this.checkPermission(inviterId, organizationId, [TeamRole.ADMIN, TeamRole.MANAGER]);

    const organization = await this.findById(organizationId);

    // Check team member limit
    const currentCount = await this.teamMembersRepository.count({
      where: { organizationId, isActive: true },
    });
    if (currentCount >= organization.teamMembersLimit) {
      throw new BadRequestException('Team member limit reached. Please upgrade your plan.');
    }

    // Check if user exists
    const existingUser = await this.usersRepository.findOne({
      where: { email: inviteDto.email },
    });

    // Check if already a member
    if (existingUser) {
      const existingMember = await this.teamMembersRepository.findOne({
        where: { userId: existingUser.id, organizationId },
      });
      if (existingMember) {
        throw new ConflictException('User is already a member of this organization');
      }
    }

    // Check for pending invite
    const pendingInvite = await this.teamMembersRepository
      .createQueryBuilder('tm')
      .where('tm.inviteEmail = :email', { email: inviteDto.email })
      .andWhere('tm.organizationId = :organizationId', { organizationId })
      .andWhere('tm.inviteAcceptedAt IS NULL')
      .getOne();
    if (pendingInvite) {
      throw new ConflictException('An invitation has already been sent to this email');
    }

    // Create invite
    const inviteToken = uuidv4();
    const teamMember = this.teamMembersRepository.create({
      organizationId,
      userId: existingUser?.id,
      role: inviteDto.role,
      inviteToken,
      inviteEmail: inviteDto.email,
      isActive: false,
    });

    await this.teamMembersRepository.save(teamMember);

    // TODO: Send invitation email
    console.log(`Invitation sent to ${inviteDto.email} with token: ${inviteToken}`);

    return teamMember;
  }

  async acceptInvite(inviteToken: string, userId: string): Promise<TeamMember> {
    const teamMember = await this.teamMembersRepository.findOne({
      where: { inviteToken },
      relations: ['organization'],
    });

    if (!teamMember) {
      throw new NotFoundException('Invalid invitation token');
    }

    if (teamMember.inviteAcceptedAt) {
      throw new BadRequestException('Invitation has already been accepted');
    }

    teamMember.userId = userId;
    teamMember.inviteAcceptedAt = new Date();
    teamMember.inviteToken = null;
    teamMember.isActive = true;

    return this.teamMembersRepository.save(teamMember);
  }

  async updateTeamMember(
    organizationId: string,
    memberId: string,
    updaterId: string,
    updateDto: UpdateTeamMemberDto,
  ): Promise<TeamMember> {
    await this.checkPermission(updaterId, organizationId, [TeamRole.ADMIN]);

    const teamMember = await this.teamMembersRepository.findOne({
      where: { id: memberId, organizationId },
      relations: ['user'],
    });

    if (!teamMember) {
      throw new NotFoundException('Team member not found');
    }

    // Prevent demoting owner
    const organization = await this.findById(organizationId);
    if (teamMember.userId === organization.ownerId && updateDto.role !== TeamRole.ADMIN) {
      throw new ForbiddenException('Cannot change the role of the organization owner');
    }

    Object.assign(teamMember, updateDto);
    return this.teamMembersRepository.save(teamMember);
  }

  async removeTeamMember(organizationId: string, memberId: string, removerId: string): Promise<void> {
    await this.checkPermission(removerId, organizationId, [TeamRole.ADMIN]);

    const teamMember = await this.teamMembersRepository.findOne({
      where: { id: memberId, organizationId },
    });

    if (!teamMember) {
      throw new NotFoundException('Team member not found');
    }

    // Prevent removing owner
    const organization = await this.findById(organizationId);
    if (teamMember.userId === organization.ownerId) {
      throw new ForbiddenException('Cannot remove the organization owner');
    }

    await this.teamMembersRepository.remove(teamMember);
  }

  async getUserRole(userId: string, organizationId: string): Promise<TeamRole | null> {
    const teamMember = await this.teamMembersRepository.findOne({
      where: { userId, organizationId, isActive: true },
    });
    return teamMember?.role || null;
  }

  async checkPermission(
    userId: string,
    organizationId: string,
    allowedRoles: TeamRole[],
  ): Promise<void> {
    const role = await this.getUserRole(userId, organizationId);
    if (!role || !allowedRoles.includes(role)) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }
  }

  async getUsageStats(organizationId: string): Promise<{
    surveys: number;
    responses: number;
    customers: number;
    teamMembers: number;
  }> {
    const organization = await this.findById(organizationId);

    // This would be populated with actual counts from related tables
    // For now, returning placeholder data
    const teamMembersCount = await this.teamMembersRepository.count({
      where: { organizationId, isActive: true },
    });

    return {
      surveys: 0, // TODO: Count from surveys table
      responses: 0, // TODO: Count from responses table
      customers: 0, // TODO: Count from customers table
      teamMembers: teamMembersCount,
    };
  }
}
