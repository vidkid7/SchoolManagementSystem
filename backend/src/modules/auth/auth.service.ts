import User, { UserRole, UserStatus } from '@models/User.model';
import { 
  AuthenticationError, 
  ValidationError, 
  ConflictError,
  NotFoundError 
} from '@middleware/errorHandler';
import { logger, logSecurityEvent, SECURITY_EVENTS } from '@utils/logger';
import jwtService, { JWTPayload } from './jwt.service';
import accountLockoutService from './accountLockout.service';

/**
 * Authentication Service
 * Handles all authentication-related business logic
 * Uses JWT service for token management with Redis storage
 */
class AuthService {

  /**
   * Register new user
   * @param userData - User registration data
   * @returns Created user (without password)
   */
  async register(userData: {
    username: string;
    email: string;
    password: string;
    role: UserRole;
    phoneNumber?: string;
  }): Promise<Record<string, unknown>> {
    // Check if username already exists
    const existingUsername = await User.findOne({
      where: { username: userData.username }
    });

    if (existingUsername) {
      throw new ConflictError('Username already exists');
    }

    // Check if email already exists
    const existingEmail = await User.findOne({
      where: { email: userData.email }
    });

    if (existingEmail) {
      throw new ConflictError('Email already exists');
    }

    // Create user (password will be hashed by beforeCreate hook)
    const user = await User.create({
      username: userData.username,
      email: userData.email,
      password: userData.password,
      role: userData.role,
      phoneNumber: userData.phoneNumber,
      status: UserStatus.ACTIVE,
      failedLoginAttempts: 0
    });

    logger.info('User registered successfully', {
      userId: user.userId,
      username: user.username,
      role: user.role
    });

    // Remove password from response
    const userJson = user.toJSON() as unknown as Record<string, unknown>;
    delete userJson.password;
    return userJson;
  }

  /**
   * Login user
   * Implements account lockout mechanism with Redis tracking
   * @param username - Username or email
   * @param password - User password
   * @param rememberMe - Extended session if true
   * @returns Access token, refresh token, and user data
   * 
   * Requirements: 1.2, 1.9, 38.1
   */
  // eslint-disable-next-line max-lines-per-function
  async login(
    username: string,
    password: string,
    rememberMe = false
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: Record<string, unknown>;
  }> {
    // Check Redis-based lockout status first (15-minute window)
    const lockoutStatus = await accountLockoutService.checkLockoutStatus(username);
    
    if (lockoutStatus.isLocked) {
      const minutesRemaining = Math.ceil((lockoutStatus.lockoutTimeRemaining || 0) / 60);
      
      logSecurityEvent({
        event: SECURITY_EVENTS.AUTH_FAILURE,
        userEmail: username,
        outcome: 'failure',
        details: {
          reason: 'account_locked',
          lockoutTimeRemaining: lockoutStatus.lockoutTimeRemaining,
          failedAttempts: lockoutStatus.failedAttempts
        }
      });

      throw new AuthenticationError(
        `Account is locked due to multiple failed login attempts. Please try again in ${minutesRemaining} minutes`
      );
    }

    // Find user by username or email
    const user = await User.findOne({
      where: {
        [username.includes('@') ? 'email' : 'username']: username
      }
    });

    if (!user) {
      // Record failed attempt even if user not found (prevent user enumeration timing attacks)
      await accountLockoutService.recordFailedAttempt(username);
      
      logSecurityEvent({
        event: SECURITY_EVENTS.AUTH_FAILURE,
        userEmail: username,
        outcome: 'failure',
        details: {
          reason: 'invalid_credentials',
          userExists: false
        }
      });

      throw new AuthenticationError('Invalid credentials');
    }

    // Check database-level account lock (backup/persistent lock)
    if (user.isAccountLocked()) {
      const lockTimeRemaining = user.accountLockedUntil 
        ? Math.ceil((user.accountLockedUntil.getTime() - Date.now()) / 60000)
        : 15;
      
      logSecurityEvent({
        event: SECURITY_EVENTS.AUTH_FAILURE,
        userId: user.userId,
        userEmail: user.email,
        userRole: user.role,
        outcome: 'failure',
        details: {
          reason: 'account_locked_database',
          lockTimeRemaining
        }
      });

      throw new AuthenticationError(
        `Account is locked. Please try again in ${lockTimeRemaining} minutes`
      );
    }

    // Check if account is active
    if (user.status !== UserStatus.ACTIVE) {
      logSecurityEvent({
        event: SECURITY_EVENTS.AUTH_FAILURE,
        userId: user.userId,
        userEmail: user.email,
        userRole: user.role,
        outcome: 'failure',
        details: {
          reason: 'account_inactive',
          status: user.status
        }
      });

      throw new AuthenticationError('Account is not active');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      // Record failed attempt in Redis (with 15-minute window)
      const updatedLockoutStatus = await accountLockoutService.recordFailedAttempt(
        username,
        user.userId
      );

      // Also update database counter for persistent tracking
      user.failedLoginAttempts += 1;

      // If Redis lockout triggered, also lock in database
      if (updatedLockoutStatus.isLocked) {
        user.accountLockedUntil = updatedLockoutStatus.lockoutExpiresAt;
        await user.save();

        const minutesRemaining = Math.ceil((updatedLockoutStatus.lockoutTimeRemaining || 0) / 60);

        throw new AuthenticationError(
          `Account locked due to multiple failed login attempts. Please try again in ${minutesRemaining} minutes`
        );
      }

      await user.save();

      logSecurityEvent({
        event: SECURITY_EVENTS.AUTH_FAILURE,
        userId: user.userId,
        userEmail: user.email,
        userRole: user.role,
        outcome: 'failure',
        details: {
          reason: 'invalid_password',
          failedAttempts: updatedLockoutStatus.failedAttempts,
          remainingAttempts: updatedLockoutStatus.remainingAttempts
        }
      });

      throw new AuthenticationError('Invalid credentials');
    }

    // Successful login - reset all lockout tracking
    await accountLockoutService.resetFailedAttempts(username, user.userId);
    
    user.failedLoginAttempts = 0;
    user.accountLockedUntil = undefined;
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens using JWT service (stores refresh token in Redis)
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: user.userId,
      username: user.username,
      email: user.email,
      role: user.role
    };

    const { accessToken, refreshToken } = await jwtService.generateTokenPair(payload, rememberMe);

    // Log successful authentication
    logSecurityEvent({
      event: SECURITY_EVENTS.AUTH_SUCCESS,
      userId: user.userId,
      userEmail: user.email,
      userRole: user.role,
      outcome: 'success',
      details: {
        rememberMe
      }
    });

    logger.info('User logged in successfully', {
      userId: user.userId,
      username: user.username,
      rememberMe
    });

    // Remove sensitive data from response
    const userJson = user.toJSON() as unknown as Record<string, unknown>;
    delete userJson.password;
    delete userJson.refreshToken;

    return {
      accessToken,
      refreshToken,
      user: userJson
    };
  }

  /**
   * Refresh access token using refresh token
   * Uses JWT service with Redis storage
   * @param refreshToken - Valid refresh token
   * @returns New access token and refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      // Use JWT service to refresh tokens (validates against Redis)
      const tokens = await jwtService.refreshTokens(refreshToken);

      logger.info('Access token refreshed via JWT service');

      return tokens;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      logger.error('Error refreshing access token', { error });
      throw new AuthenticationError('Failed to refresh access token');
    }
  }

  /**
   * Logout user
   * Invalidates refresh token in Redis
   * @param userId - User ID
   */
  async logout(userId: number): Promise<void> {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new NotFoundError('User');
    }

    // Invalidate refresh token in Redis
    await jwtService.invalidateRefreshToken(userId);

    logger.info('User logged out', {
      userId: user.userId,
      username: user.username
    });
  }

  /**
   * Change user password
   * @param userId - User ID
   * @param currentPassword - Current password
   * @param newPassword - New password
   */
  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new NotFoundError('User');
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Check if new password is same as current
    const isSamePassword = await user.comparePassword(newPassword);

    if (isSamePassword) {
      throw new ValidationError('New password must be different from current password');
    }

    // Update password (will be hashed by beforeUpdate hook)
    user.password = newPassword;
    await user.save();

    // Invalidate all refresh tokens to force re-login
    await jwtService.invalidateAllUserTokens(userId);

    logger.info('Password changed successfully', {
      userId: user.userId,
      username: user.username
    });
  }

  /**
   * Request password reset
   * Generates reset token and sends email/SMS
   * @param email - User email
   * @returns Reset token (for development/testing - in production, only send via email/SMS)
   * 
   * Requirements: 1.11
   */
  async forgotPassword(email: string): Promise<{ message: string; resetToken?: string }> {
    const user = await User.findOne({
      where: { email }
    });

    if (!user) {
      // Don't reveal if user exists (security best practice)
      // But still return success message
      logger.warn('Password reset requested for non-existent email', { email });
      return {
        message: 'If an account with that email exists, a password reset link has been sent'
      };
    }

    // Generate password reset token
    const resetToken = await user.generatePasswordResetToken();

    // TODO: Send reset token via email/SMS
    // For now, we'll return it in the response (development only)
    // In production, this should be sent via email/SMS and not returned
    logger.info('Password reset token generated', {
      userId: user.userId,
      email: user.email
    });

    logSecurityEvent({
      event: SECURITY_EVENTS.PASSWORD_RESET_REQUEST,
      userId: user.userId,
      userEmail: user.email,
      outcome: 'success',
      details: {
        requestedAt: new Date().toISOString()
      }
    });

    // In development, return the token
    // In production, remove resetToken from response
    if (process.env.NODE_ENV === 'development') {
      return {
        message: 'Password reset link has been sent to your email',
        resetToken // Only for development/testing
      };
    }

    return {
      message: 'If an account with that email exists, a password reset link has been sent'
    };
  }

  /**
   * Reset password using reset token
   * @param token - Password reset token
   * @param newPassword - New password
   * 
   * Requirements: 1.11
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Verify token and get user
    const user = await User.verifyPasswordResetToken(token);

    if (!user) {
      logSecurityEvent({
        event: SECURITY_EVENTS.PASSWORD_RESET_FAILURE,
        outcome: 'failure',
        details: {
          reason: 'invalid_or_expired_token'
        }
      });

      throw new AuthenticationError('Invalid or expired password reset token');
    }

    // Check if new password is same as current
    const isSamePassword = await user.comparePassword(newPassword);

    if (isSamePassword) {
      throw new ValidationError('New password must be different from current password');
    }

    // Update password (will be hashed by beforeUpdate hook)
    user.password = newPassword;
    
    // Clear reset token
    await user.clearPasswordResetToken();

    // Invalidate all refresh tokens to force re-login
    await jwtService.invalidateAllUserTokens(user.userId);

    logger.info('Password reset successfully', {
      userId: user.userId,
      email: user.email
    });

    logSecurityEvent({
      event: SECURITY_EVENTS.PASSWORD_RESET_SUCCESS,
      userId: user.userId,
      userEmail: user.email,
      outcome: 'success',
      details: {
        resetAt: new Date().toISOString()
      }
    });
  }

  /**
   * Verify JWT token
   * Uses JWT service for verification
   * @param token - JWT token
   * @returns Decoded payload
   */
  verifyAccessToken(token: string): JWTPayload {
    return jwtService.verifyAccessToken(token);
  }

  /**
   * Get user by ID
   * @param userId - User ID
   * @returns User without password
   */
  async getUserById(userId: number): Promise<Record<string, unknown>> {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new NotFoundError('User');
    }

    const userJson = user.toJSON() as unknown as Record<string, unknown>;
    delete userJson.password;
    return userJson;
  }

  /**
   * Get account lockout status
   * @param identifier - Username or email
   * @returns Lockout status from Redis
   * 
   * Requirements: 1.9
   */
  async getLockoutStatus(identifier: string) {
    return accountLockoutService.checkLockoutStatus(identifier);
  }

  /**
   * Manually unlock an account (admin action)
   * @param identifier - Username or email
   * @param adminUserId - Admin user ID performing the unlock
   * 
   * Requirements: 1.9, 38.1
   */
  async unlockAccount(identifier: string, adminUserId: number): Promise<void> {
    // Find user to unlock
    const user = await User.findOne({
      where: {
        [identifier.includes('@') ? 'email' : 'username']: identifier
      }
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Unlock in Redis
    await accountLockoutService.unlockAccount(identifier, adminUserId);

    // Also reset database fields
    user.failedLoginAttempts = 0;
    user.accountLockedUntil = undefined;
    await user.save();

    logger.info('Account unlocked by admin', {
      targetUserId: user.userId,
      targetUsername: user.username,
      adminUserId
    });
  }
}

export default new AuthService();
