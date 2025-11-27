import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import { User } from '../users/entities/user.entity';
import { Organization, Plan } from '../organizations/entities/organization.entity';
import { TeamMember, TeamRole } from '../organizations/entities/team-member.entity';
import { NotificationPreference } from '../settings/entities/notification-preference.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TokensDto } from './dto/tokens.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
    @InjectRepository(TeamMember)
    private teamMembersRepository: Repository<TeamMember>,
    @InjectRepository(NotificationPreference)
    private notificationPrefsRepository: Repository<NotificationPreference>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ user: User; organization: Organization; tokens: TokensDto }> {
    const { email, password, firstName, lastName, company } = registerDto;

    // Check if user exists
    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Create user
    const user = this.usersRepository.create({
      email,
      password,
      firstName,
      lastName,
    });
    await this.usersRepository.save(user);

    // Create organization
    const organization = this.organizationsRepository.create({
      name: company || `${firstName}'s Organization`,
      ownerId: user.id,
      plan: Plan.TRIAL,
      planExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
    });
    await this.organizationsRepository.save(organization);

    // Create team member (owner)
    const teamMember = this.teamMembersRepository.create({
      userId: user.id,
      organizationId: organization.id,
      role: TeamRole.ADMIN,
      inviteAcceptedAt: new Date(),
    });
    await this.teamMembersRepository.save(teamMember);

    // Create notification preferences
    const notificationPref = this.notificationPrefsRepository.create({
      userId: user.id,
    });
    await this.notificationPrefsRepository.save(notificationPref);

    // Generate tokens
    const tokens = await this.generateTokens(user, organization.id);

    // Update refresh token
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return { user, organization, tokens };
  }

  async login(loginDto: LoginDto): Promise<{ user: User; organization: Organization; tokens: TokensDto }> {
    const { email, password } = loginDto;

    // Find user with password
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Get user's organization
    const teamMember = await this.teamMembersRepository.findOne({
      where: { userId: user.id, isActive: true },
      relations: ['organization'],
    });

    if (!teamMember) {
      throw new UnauthorizedException('No organization found');
    }

    // Update last login
    user.lastLoginAt = new Date();
    await this.usersRepository.save(user);

    // Generate tokens
    const tokens = await this.generateTokens(user, teamMember.organizationId);

    // Update refresh token
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return { user, organization: teamMember.organization, tokens };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();

    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async logout(userId: string): Promise<void> {
    await this.usersRepository.update(userId, { refreshToken: null });
  }

  async refreshTokens(userId: string, refreshToken: string): Promise<TokensDto> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.refreshToken')
      .where('user.id = :userId', { userId })
      .getOne();

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access denied');
    }

    const refreshTokenMatches = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Access denied');
    }

    // Get organization
    const teamMember = await this.teamMembersRepository.findOne({
      where: { userId: user.id, isActive: true },
    });

    const tokens = await this.generateTokens(user, teamMember?.organizationId);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if user exists
      return;
    }

    const resetToken = uuidv4();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.passwordResetToken = await bcrypt.hash(resetToken, 10);
    user.passwordResetExpires = resetExpires;
    await this.usersRepository.save(user);

    // TODO: Send email with reset token
    console.log(`Password reset token for ${email}: ${resetToken}`);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const users = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordResetToken')
      .addSelect('user.passwordResetExpires')
      .where('user.passwordResetExpires > :now', { now: new Date() })
      .getMany();

    let validUser: User | null = null;
    for (const user of users) {
      if (user.passwordResetToken && (await bcrypt.compare(token, user.passwordResetToken))) {
        validUser = user;
        break;
      }
    }

    if (!validUser) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    validUser.password = newPassword;
    validUser.passwordResetToken = null;
    validUser.passwordResetExpires = null;
    await this.usersRepository.save(validUser);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :userId', { userId })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    user.password = newPassword;
    await this.usersRepository.save(user);
  }

  private async generateTokens(user: User, organizationId?: string): Promise<TokensDto> {
    const payload = {
      sub: user.id,
      email: user.email,
      organizationId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  private async updateRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.usersRepository.update(userId, { refreshToken: hashedRefreshToken });
  }
}
