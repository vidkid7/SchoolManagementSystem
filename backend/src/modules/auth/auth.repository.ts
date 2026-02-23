import { Op, WhereOptions } from 'sequelize';
import User, { UserRole, UserStatus, UserAttributes, UserCreationAttributes } from '@models/User.model';
import { logger } from '@utils/logger';

/**
 * User Repository
 * Handles all database operations for User entity using parameterized queries
 * Requirements: 1.1, 36.2, 1.9
 */
class UserRepository {
  /**
   * Create a new user
   * @param userData - User creation data
   * @returns Created user instance
   */
  async create(userData: UserCreationAttributes): Promise<User> {
    try {
      const user = await User.create(userData);
      logger.info('User created in database', { userId: user.userId, username: user.username });
      return user;
    } catch (error) {
      logger.error('Error creating user', { error, userData: { ...userData, password: '[REDACTED]' } });
      throw error;
    }
  }

  /**
   * Find user by ID
   * @param userId - User ID
   * @returns User instance or null
   */
  async findById(userId: number): Promise<User | null> {
    try {
      return await User.findByPk(userId);
    } catch (error) {
      logger.error('Error finding user by ID', { error, userId });
      throw error;
    }
  }

  /**
   * Find user by username
   * @param username - Username
   * @returns User instance or null
   */
  async findByUsername(username: string): Promise<User | null> {
    try {
      return await User.findOne({
        where: { username }
      });
    } catch (error) {
      logger.error('Error finding user by username', { error, username });
      throw error;
    }
  }

  /**
   * Find user by email
   * @param email - Email address
   * @returns User instance or null
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      return await User.findOne({
        where: { email }
      });
    } catch (error) {
      logger.error('Error finding user by email', { error, email });
      throw error;
    }
  }

  /**
   * Find user by username or email
   * @param identifier - Username or email
   * @returns User instance or null
   */
  async findByUsernameOrEmail(identifier: string): Promise<User | null> {
    try {
      const isEmail = identifier.includes('@');
      return await User.findOne({
        where: {
          [isEmail ? 'email' : 'username']: identifier
        }
      });
    } catch (error) {
      logger.error('Error finding user by username or email', { error, identifier });
      throw error;
    }
  }

  /**
   * Find all users with optional filters
   * @param filters - Optional filters (role, status, etc.)
   * @param options - Pagination and sorting options
   * @returns Array of users and total count
   */
  async findAll(
    filters?: {
      role?: UserRole;
      status?: UserStatus;
      search?: string;
    },
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDirection?: 'ASC' | 'DESC';
    }
  ): Promise<{ users: User[]; total: number }> {
    try {
      const where: WhereOptions<UserAttributes> = {};

      // Apply filters
      if (filters?.role) {
        where.role = filters.role;
      }

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.search) {
        where[Op.or as unknown as keyof WhereOptions<UserAttributes>] = [
          { username: { [Op.like]: `%${filters.search}%` } },
          { email: { [Op.like]: `%${filters.search}%` } }
        ] as unknown as WhereOptions<UserAttributes>[keyof WhereOptions<UserAttributes>];
      }

      // Set pagination defaults
      const limit = options?.limit || 20;
      const offset = options?.offset || 0;
      const orderBy = options?.orderBy || 'createdAt';
      const orderDirection = options?.orderDirection || 'DESC';

      // Execute query with parameterized filters
      const { rows: users, count: total } = await User.findAndCountAll({
        where,
        limit,
        offset,
        order: [[orderBy, orderDirection]],
        attributes: { exclude: ['password', 'refreshToken'] }
      });

      return { users, total };
    } catch (error) {
      logger.error('Error finding all users', { error, filters, options });
      throw error;
    }
  }

  /**
   * Update user by ID
   * @param userId - User ID
   * @param updateData - Data to update
   * @returns Updated user instance or null
   */
  async update(userId: number, updateData: Partial<UserAttributes>): Promise<User | null> {
    try {
      const user = await User.findByPk(userId);
      
      if (!user) {
        return null;
      }

      await user.update(updateData);
      logger.info('User updated in database', { userId, updatedFields: Object.keys(updateData) });
      
      return user;
    } catch (error) {
      logger.error('Error updating user', { error, userId, updateData: { ...updateData, password: '[REDACTED]' } });
      throw error;
    }
  }

  /**
   * Delete user by ID (soft delete)
   * @param userId - User ID
   * @returns True if deleted, false if not found
   */
  async delete(userId: number): Promise<boolean> {
    try {
      const user = await User.findByPk(userId);
      
      if (!user) {
        return false;
      }

      await user.destroy(); // Soft delete due to paranoid mode
      logger.info('User soft deleted', { userId });
      
      return true;
    } catch (error) {
      logger.error('Error deleting user', { error, userId });
      throw error;
    }
  }

  /**
   * Permanently delete user by ID (hard delete)
   * @param userId - User ID
   * @returns True if deleted, false if not found
   */
  async hardDelete(userId: number): Promise<boolean> {
    try {
      const user = await User.findByPk(userId, { paranoid: false });
      
      if (!user) {
        return false;
      }

      await user.destroy({ force: true });
      logger.info('User permanently deleted', { userId });
      
      return true;
    } catch (error) {
      logger.error('Error permanently deleting user', { error, userId });
      throw error;
    }
  }

  /**
   * Restore soft-deleted user
   * @param userId - User ID
   * @returns Restored user instance or null
   */
  async restore(userId: number): Promise<User | null> {
    try {
      const user = await User.findByPk(userId, { paranoid: false });
      
      if (!user || !user.deletedAt) {
        return null;
      }

      await user.restore();
      logger.info('User restored', { userId });
      
      return user;
    } catch (error) {
      logger.error('Error restoring user', { error, userId });
      throw error;
    }
  }

  /**
   * Increment failed login attempts
   * @param userId - User ID
   * @returns Updated user instance
   */
  async incrementFailedLoginAttempts(userId: number): Promise<User | null> {
    try {
      const user = await User.findByPk(userId);
      
      if (!user) {
        return null;
      }

      user.failedLoginAttempts += 1;
      await user.save();
      
      logger.info('Failed login attempts incremented', { 
        userId, 
        attempts: user.failedLoginAttempts 
      });
      
      return user;
    } catch (error) {
      logger.error('Error incrementing failed login attempts', { error, userId });
      throw error;
    }
  }

  /**
   * Reset failed login attempts
   * @param userId - User ID
   * @returns Updated user instance
   */
  async resetFailedLoginAttempts(userId: number): Promise<User | null> {
    try {
      const user = await User.findByPk(userId);
      
      if (!user) {
        return null;
      }

      user.failedLoginAttempts = 0;
      user.accountLockedUntil = undefined;
      await user.save();
      
      logger.info('Failed login attempts reset', { userId });
      
      return user;
    } catch (error) {
      logger.error('Error resetting failed login attempts', { error, userId });
      throw error;
    }
  }

  /**
   * Lock user account until specified time
   * @param userId - User ID
   * @param lockUntil - Lock until date
   * @returns Updated user instance
   */
  async lockAccount(userId: number, lockUntil: Date): Promise<User | null> {
    try {
      const user = await User.findByPk(userId);
      
      if (!user) {
        return null;
      }

      user.accountLockedUntil = lockUntil;
      user.status = UserStatus.LOCKED;
      await user.save();
      
      logger.warn('User account locked', { userId, lockUntil });
      
      return user;
    } catch (error) {
      logger.error('Error locking user account', { error, userId });
      throw error;
    }
  }

  /**
   * Unlock user account
   * @param userId - User ID
   * @returns Updated user instance
   */
  async unlockAccount(userId: number): Promise<User | null> {
    try {
      const user = await User.findByPk(userId);
      
      if (!user) {
        return null;
      }

      user.accountLockedUntil = undefined;
      user.failedLoginAttempts = 0;
      user.status = UserStatus.ACTIVE;
      await user.save();
      
      logger.info('User account unlocked', { userId });
      
      return user;
    } catch (error) {
      logger.error('Error unlocking user account', { error, userId });
      throw error;
    }
  }

  /**
   * Update user's last login timestamp
   * @param userId - User ID
   * @returns Updated user instance
   */
  async updateLastLogin(userId: number): Promise<User | null> {
    try {
      const user = await User.findByPk(userId);
      
      if (!user) {
        return null;
      }

      user.lastLogin = new Date();
      await user.save();
      
      return user;
    } catch (error) {
      logger.error('Error updating last login', { error, userId });
      throw error;
    }
  }

  /**
   * Update user's refresh token
   * @param userId - User ID
   * @param refreshToken - Refresh token
   * @param expiresAt - Token expiry date
   * @returns Updated user instance
   */
  async updateRefreshToken(
    userId: number, 
    refreshToken: string | undefined, 
    expiresAt: Date | undefined
  ): Promise<User | null> {
    try {
      const user = await User.findByPk(userId);
      
      if (!user) {
        return null;
      }

      user.refreshToken = refreshToken;
      user.refreshTokenExpiresAt = expiresAt;
      await user.save();
      
      return user;
    } catch (error) {
      logger.error('Error updating refresh token', { error, userId });
      throw error;
    }
  }

  /**
   * Find users by role
   * @param role - User role
   * @returns Array of users
   */
  async findByRole(role: UserRole): Promise<User[]> {
    try {
      return await User.findAll({
        where: { role },
        attributes: { exclude: ['password', 'refreshToken'] }
      });
    } catch (error) {
      logger.error('Error finding users by role', { error, role });
      throw error;
    }
  }

  /**
   * Count users by role
   * @param role - User role (optional)
   * @returns Count of users
   */
  async countByRole(role?: UserRole): Promise<number> {
    try {
      const where: WhereOptions<UserAttributes> = role ? { role } : {};
      return await User.count({ where });
    } catch (error) {
      logger.error('Error counting users by role', { error, role });
      throw error;
    }
  }

  /**
   * Check if username exists
   * @param username - Username to check
   * @param excludeUserId - User ID to exclude from check (for updates)
   * @returns True if exists, false otherwise
   */
  async usernameExists(username: string, excludeUserId?: number): Promise<boolean> {
    try {
      const where: WhereOptions<UserAttributes> = { username };
      
      if (excludeUserId) {
        where.userId = { [Op.ne]: excludeUserId };
      }

      const count = await User.count({ where });
      return count > 0;
    } catch (error) {
      logger.error('Error checking username existence', { error, username });
      throw error;
    }
  }

  /**
   * Check if email exists
   * @param email - Email to check
   * @param excludeUserId - User ID to exclude from check (for updates)
   * @returns True if exists, false otherwise
   */
  async emailExists(email: string, excludeUserId?: number): Promise<boolean> {
    try {
      const where: WhereOptions<UserAttributes> = { email };
      
      if (excludeUserId) {
        where.userId = { [Op.ne]: excludeUserId };
      }

      const count = await User.count({ where });
      return count > 0;
    } catch (error) {
      logger.error('Error checking email existence', { error, email });
      throw error;
    }
  }
}

export default new UserRepository();
