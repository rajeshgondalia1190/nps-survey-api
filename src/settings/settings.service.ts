import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationPreference } from './entities/notification-preference.entity';
import { User } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(NotificationPreference)
    private notificationPrefsRepository: Repository<NotificationPreference>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
  ) {}

  async getNotificationPreferences(userId: string): Promise<NotificationPreference> {
    let prefs = await this.notificationPrefsRepository.findOne({
      where: { userId },
    });

    // Create default preferences if not exists
    if (!prefs) {
      prefs = this.notificationPrefsRepository.create({
        userId,
        newResponses: true,
        npsAlerts: true,
        detractorAlerts: true,
        weeklySummary: true,
        monthlyReport: true,
        emailNotifications: true,
        pushNotifications: false,
        slackNotifications: false,
      });
      prefs = await this.notificationPrefsRepository.save(prefs);
    }

    return prefs;
  }

  async updateNotificationPreferences(
    userId: string,
    updateDto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreference> {
    let prefs = await this.notificationPrefsRepository.findOne({
      where: { userId },
    });

    if (!prefs) {
      prefs = this.notificationPrefsRepository.create({
        userId,
        ...updateDto,
      });
    } else {
      Object.assign(prefs, updateDto);
    }

    return this.notificationPrefsRepository.save(prefs);
  }

  async getAccountSettings(userId: string): Promise<{
    user: Partial<User>;
    twoFactorEnabled: boolean;
    sessionsCount: number;
  }> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        bio: user.bio,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
      twoFactorEnabled: user.twoFactorEnabled,
      sessionsCount: 1, // Simplified - would need session tracking table
    };
  }

  async getSecuritySettings(userId: string): Promise<{
    twoFactorEnabled: boolean;
    lastPasswordChange: Date | null;
    activeSessions: number;
  }> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      twoFactorEnabled: user.twoFactorEnabled,
      lastPasswordChange: user.updatedAt, // Simplified
      activeSessions: 1,
    };
  }

  async enableTwoFactor(userId: string): Promise<{ secret: string; qrCode: string }> {
    // In production, generate actual TOTP secret
    const secret = 'DEMO_SECRET_KEY_12345';
    const qrCode = `otpauth://totp/NPSSurvey:user?secret=${secret}&issuer=NPSSurvey`;

    return { secret, qrCode };
  }

  async verifyAndEnableTwoFactor(userId: string, code: string): Promise<boolean> {
    // In production, verify the TOTP code
    if (code.length !== 6) {
      return false;
    }

    await this.usersRepository.update(userId, {
      twoFactorEnabled: true,
      twoFactorSecret: 'encrypted_secret', // Would be encrypted in production
    });

    return true;
  }

  async disableTwoFactor(userId: string): Promise<void> {
    await this.usersRepository.update(userId, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
    });
  }

  async getBillingInfo(organizationId: string): Promise<{
    plan: string;
    planExpiresAt: Date | null;
    usage: {
      surveys: { used: number; limit: number };
      responses: { used: number; limit: number };
      teamMembers: { used: number; limit: number };
    };
  }> {
    const org = await this.organizationsRepository.findOne({
      where: { id: organizationId },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    // In production, get actual usage from related tables
    return {
      plan: org.plan,
      planExpiresAt: org.planExpiresAt,
      usage: {
        surveys: { used: 0, limit: org.surveysLimit },
        responses: { used: 0, limit: org.responsesLimit },
        teamMembers: { used: 0, limit: org.teamMembersLimit },
      },
    };
  }

  async getAllSettings(userId: string, organizationId: string): Promise<{
    account: any;
    notifications: NotificationPreference;
    security: any;
    billing: any;
  }> {
    const [account, notifications, security, billing] = await Promise.all([
      this.getAccountSettings(userId),
      this.getNotificationPreferences(userId),
      this.getSecuritySettings(userId),
      this.getBillingInfo(organizationId),
    ]);

    return { account, notifications, security, billing };
  }
}
