import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { InviteTeamMemberDto } from './dto/invite-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('team')
@Controller('organizations/me/team')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TeamController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all team members' })
  @ApiResponse({ status: 200, description: 'Team members retrieved' })
  async getTeamMembers(@CurrentUser('organizationId') organizationId: string) {
    const members = await this.organizationsService.getTeamMembers(organizationId);
    return {
      members: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        email: m.user?.email || m.inviteEmail,
        firstName: m.user?.firstName,
        lastName: m.user?.lastName,
        avatar: m.user?.avatar,
        role: m.role,
        isActive: m.isActive,
        isPending: !m.inviteAcceptedAt,
        joinedAt: m.inviteAcceptedAt || m.createdAt,
      })),
    };
  }

  @Post('invite')
  @ApiOperation({ summary: 'Invite a new team member' })
  @ApiResponse({ status: 201, description: 'Invitation sent' })
  @ApiResponse({ status: 409, description: 'User already a member or invited' })
  async inviteTeamMember(
    @CurrentUser('id') userId: string,
    @CurrentUser('organizationId') organizationId: string,
    @Body() inviteDto: InviteTeamMemberDto,
  ) {
    const member = await this.organizationsService.inviteTeamMember(
      organizationId,
      userId,
      inviteDto,
    );
    return {
      member: {
        id: member.id,
        email: member.inviteEmail,
        role: member.role,
        isPending: true,
      },
      message: 'Invitation sent successfully',
    };
  }

  @Post('invites/:token/accept')
  @ApiOperation({ summary: 'Accept team invitation' })
  @ApiResponse({ status: 200, description: 'Invitation accepted' })
  @ApiResponse({ status: 404, description: 'Invalid invitation' })
  async acceptInvite(
    @CurrentUser('id') userId: string,
    @Param('token') token: string,
  ) {
    const member = await this.organizationsService.acceptInvite(token, userId);
    return {
      member: {
        id: member.id,
        organizationId: member.organizationId,
        role: member.role,
      },
      message: 'Invitation accepted successfully',
    };
  }

  @Patch(':memberId')
  @ApiOperation({ summary: 'Update team member role' })
  @ApiResponse({ status: 200, description: 'Team member updated' })
  async updateTeamMember(
    @CurrentUser('id') userId: string,
    @CurrentUser('organizationId') organizationId: string,
    @Param('memberId') memberId: string,
    @Body() updateDto: UpdateTeamMemberDto,
  ) {
    const member = await this.organizationsService.updateTeamMember(
      organizationId,
      memberId,
      userId,
      updateDto,
    );
    return { member, message: 'Team member updated successfully' };
  }

  @Delete(':memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove team member' })
  @ApiResponse({ status: 204, description: 'Team member removed' })
  async removeTeamMember(
    @CurrentUser('id') userId: string,
    @CurrentUser('organizationId') organizationId: string,
    @Param('memberId') memberId: string,
  ) {
    await this.organizationsService.removeTeamMember(organizationId, memberId, userId);
  }
}
