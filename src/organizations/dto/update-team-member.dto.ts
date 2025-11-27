import { IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TeamRole } from '../entities/team-member.entity';

export class UpdateTeamMemberDto {
  @ApiPropertyOptional({ enum: TeamRole, description: 'Team member role' })
  @IsEnum(TeamRole)
  @IsOptional()
  role?: TeamRole;

  @ApiPropertyOptional({ description: 'Is the team member active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
