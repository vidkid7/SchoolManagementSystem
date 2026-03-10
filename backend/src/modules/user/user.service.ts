/**
 * User Service
 * 
 * Business logic for user management operations
 */

import User, { UserStatus, UserRole } from '../../models/User.model';
import AuditLog from '../../models/AuditLog.model';
import { Op } from 'sequelize';
import crypto from 'crypto';
import smsService from '../../services/sms.service';
import { logger } from '../../utils/logger';

export interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  page: number;
  limit: number;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  roleId: string;
  status?: UserStatus;
}

export interface UpdateUserData {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  roleId?: string;
  status?: UserStatus;
}

export class UserService {
  /**
   * Get all users with filters
   */
  async getAllUsers(filters: UserFilters): Promise<{ users: any[]; total: number }> {
    const where: any = {};

    if (filters.search) {
      where[Op.or] = [
        { username: { [Op.like]: `%${filters.search}%` } },
        { email: { [Op.like]: `%${filters.search}%` } },
      ];
    }

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const offset = (filters.page - 1) * filters.limit;

    const { count, rows } = await User.findAndCountAll({
      where,
      offset,
      limit: filters.limit,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['password', 'refreshToken', 'passwordResetToken'] },
    });

    const users = rows.map(user => this.formatUser(user));

    return { users, total: count };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: number): Promise<any> {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password', 'refreshToken', 'passwordResetToken'] },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return this.formatUser(user);
  }

  /**
   * Create new user
   */
  async createUser(data: CreateUserData): Promise<any> {
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username: data.username }, { email: data.email }],
      },
    });

    if (existingUser) {
      throw new Error('Username or email already exists');
    }

    const user = await User.create({
      username: data.username,
      email: data.email,
      password: data.password,
      role: data.roleId as UserRole,
      status: data.status || UserStatus.ACTIVE,
      phoneNumber: data.phone,
      failedLoginAttempts: 0,
    });

    return this.formatUser(user);
  }

  /**
   * Update user
   */
  async updateUser(userId: number, data: UpdateUserData): Promise<any> {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('User not found');
    }

    if (data.email && data.email !== user.email) {
      const existingUser = await User.findOne({
        where: { email: data.email },
      });
      if (existingUser) {
        throw new Error('Email already in use');
      }
    }

    const updateData: any = {};
    if (data.email) updateData.email = data.email;
    if (data.phone) updateData.phoneNumber = data.phone;
    if (data.roleId) updateData.role = data.roleId as UserRole;
    if (data.status) updateData.status = data.status;

    await user.update(updateData);

    return this.formatUser(user);
  }

  /**
   * Delete user
   */
  async deleteUser(userId: number): Promise<void> {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('User not found');
    }

    await user.destroy();
  }

  /**
   * Reset user password
   */
  async resetPassword(userId: number): Promise<void> {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('User not found');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await user.update({
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

    if (user.phoneNumber) {
      const smsResult = await smsService.sendSMS(
        user.phoneNumber,
        `Admin initiated password reset. Use this link within 60 minutes: ${resetUrl}`
      );

      if (!smsResult.success) {
        logger.warn('Failed to send user reset-password SMS', {
          userId,
          error: smsResult.error
        });
      }
    } else {
      logger.info('User has no phone number for reset-password SMS', { userId });
    }
  }

  /**
   * Get user activity log
   */
  async getUserActivity(userId: number): Promise<any[]> {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('User not found');
    }

    const logs = await AuditLog.findAll({
      where: { userId },
      order: [['timestamp', 'DESC'], ['auditLogId', 'DESC']],
      limit: 100
    });

    return logs.map(log => ({
      id: log.auditLogId,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      changedFields: log.changedFields || [],
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      metadata: log.metadata,
      timestamp: log.timestamp
    }));
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    suspended: number;
  }> {
    const total = await User.count();
    const active = await User.count({ where: { status: UserStatus.ACTIVE } });
    const inactive = await User.count({ where: { status: UserStatus.INACTIVE } });
    const suspended = await User.count({ where: { status: UserStatus.SUSPENDED } });

    return { total, active, inactive, suspended };
  }

  /**
   * Format user for response
   */
  private formatUser(user: User): any {
    return {
      userId: user.userId,
      username: user.username,
      email: user.email,
      firstName: '', // These would come from Staff/Student tables
      lastName: '',
      phone: user.phoneNumber,
      role: user.role,
      roleName: this.getRoleDisplayName(user.role),
      municipalityId: user.municipalityId,
      schoolConfigId: user.schoolConfigId,
      status: user.status,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      avatar: user.profilePhoto,
    };
  }

  /**
   * Get display name for role
   */
  private getRoleDisplayName(role: UserRole): string {
    const roleNames: Record<UserRole, string> = {
      [UserRole.MUNICIPALITY_ADMIN]: 'Municipality Admin',
      [UserRole.SCHOOL_ADMIN]: 'School Admin',
      [UserRole.SUBJECT_TEACHER]: 'Subject Teacher',
      [UserRole.CLASS_TEACHER]: 'Class Teacher',
      [UserRole.DEPARTMENT_HEAD]: 'Department Head',
      [UserRole.ECA_COORDINATOR]: 'ECA Coordinator',
      [UserRole.SPORTS_COORDINATOR]: 'Sports Coordinator',
      [UserRole.STUDENT]: 'Student',
      [UserRole.PARENT]: 'Parent',
      [UserRole.LIBRARIAN]: 'Librarian',
      [UserRole.ACCOUNTANT]: 'Accountant',
      [UserRole.TRANSPORT_MANAGER]: 'Transport Manager',
      [UserRole.HOSTEL_WARDEN]: 'Hostel Warden',
      [UserRole.NON_TEACHING_STAFF]: 'Non-Teaching Staff',
    };
    return roleNames[role] || role;
  }
}
