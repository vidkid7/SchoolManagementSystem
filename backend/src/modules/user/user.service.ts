/**
 * User Service
 * 
 * Business logic for user management operations
 */

import { User, UserStatus, UserRole } from '../../models/User.model';
import { Op } from 'sequelize';
import crypto from 'crypto';

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

    // TODO: Send email with reset link
    // For now, just update the token
  }

  /**
   * Get user activity log
   */
  async getUserActivity(userId: number): Promise<any[]> {
    // For now, return mock activity data
    // In production, this would query an audit log table
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('User not found');
    }

    return [
      {
        id: 1,
        action: 'login',
        ipAddress: '192.168.1.1',
        userAgent: 'Chrome/120.0',
        timestamp: user.lastLogin || new Date(),
      },
      {
        id: 2,
        action: 'password_change',
        ipAddress: '192.168.1.1',
        userAgent: 'Chrome/120.0',
        timestamp: user.passwordChangedAt || new Date(),
      },
    ];
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
