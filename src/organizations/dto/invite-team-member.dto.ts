import { IsEmail, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TeamRole } from '../entities/team-member.entity';

export class InviteTeamMemberDto {
  @ApiProperty({ example: 'newmember@example.com', description: 'Email of the person to invite' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: TeamRole, description: 'Role to assign to the new member' })
  @IsEnum(TeamRole)
  role: TeamRole;
}
