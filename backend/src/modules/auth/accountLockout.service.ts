import { getRedisClient } from '@config/redis';
import { logger, logSecurityEvent, SECURITY_EVENTS } from '@utils/logger';

/**
 * Account Lockout Service
 * Tracks failed login attempts in Redis with 15-minute expiration
 * Implements automatic account lockout after 5 failed attempts
 * 
 * Requirements: 1.9, 38.1
 */

const FAILED_ATTEMPTS_PREFIX = 'failed_login_attempts:';
const LOCKOUT_PREFIX = 'account_lockout:';
const MAX_FAILED_ATTEMPTS = 5;
const ATTEMPT_WINDOW_SECONDS = 15 * 60; // 15 minutes
const LOCKOUT_DURATION_SECONDS = 15 * 60; // 15 minutes

export interface LockoutStatus {
  isLocked: boolean;
  failedAttempts: number;
  remainingAttempts: number;
  lockoutExpiresAt?: Date;
  lockoutTimeRemaining?: number; // in seconds
}

class AccountLockoutService {
  /**
   * Get Redis client with fallback handling
   */
  private getClient() {
    try {
      return getRedisClient();
    } catch (error) {
      logger.warn('Redis not available for account lockout tracking', { error });
      return null;
    }
  }

  /**
   * Get the Redis key for failed attempts tracking
   */
  private getAttemptsKey(identifier: string): string {
    return `${FAILED_ATTEMPTS_PREFIX}${identifier}`;
  }

  /**
   * Get the Redis key for lockout status
   */
  private getLockoutKey(identifier: string): string {
    return `${LOCKOUT_PREFIX}${identifier}`;
  }

  /**
   * Record a failed login attempt
   * Increments the counter in Redis with 15-minute expiration
   * Locks account if threshold is reached
   * 
   * @param identifier - Username or email
   * @param userId - User ID for logging
   * @returns Current lockout status
   */
  async recordFailedAttempt(
    identifier: string,
    userId?: number
  ): Promise<LockoutStatus> {
    const client = this.getClient();
    
    if (!client) {
      // Fallback: return unlocked status if Redis unavailable
      return {
        isLocked: false,
        failedAttempts: 0,
        remainingAttempts: MAX_FAILED_ATTEMPTS
      };
    }

    const attemptsKey = this.getAttemptsKey(identifier);
    const lockoutKey = this.getLockoutKey(identifier);

    try {
      // Increment failed attempts counter
      const attempts = await client.incr(attemptsKey);

      // Set expiration on first attempt
      if (attempts === 1) {
        await client.expire(attemptsKey, ATTEMPT_WINDOW_SECONDS);
      }

      // Check if lockout threshold reached
      if (attempts >= MAX_FAILED_ATTEMPTS) {
        // Lock the account
        const lockoutExpiresAt = new Date(Date.now() + LOCKOUT_DURATION_SECONDS * 1000);
        await client.setEx(
          lockoutKey,
          LOCKOUT_DURATION_SECONDS,
          lockoutExpiresAt.toISOString()
        );

        // Log security event
        logSecurityEvent({
          event: SECURITY_EVENTS.AUTH_LOCKOUT,
          userId: userId || 'unknown',
          userEmail: identifier,
          outcome: 'failure',
          details: {
            failedAttempts: attempts,
            lockoutDuration: LOCKOUT_DURATION_SECONDS,
            lockoutExpiresAt: lockoutExpiresAt.toISOString()
          }
        });

        logger.warn('Account locked due to failed login attempts', {
          identifier,
          userId,
          failedAttempts: attempts,
          lockoutExpiresAt: lockoutExpiresAt.toISOString()
        });

        return {
          isLocked: true,
          failedAttempts: attempts,
          remainingAttempts: 0,
          lockoutExpiresAt,
          lockoutTimeRemaining: LOCKOUT_DURATION_SECONDS
        };
      }

      // Log failed attempt
      logSecurityEvent({
        event: SECURITY_EVENTS.AUTH_FAILURE,
        userId: userId || 'unknown',
        userEmail: identifier,
        outcome: 'failure',
        details: {
          failedAttempts: attempts,
          remainingAttempts: MAX_FAILED_ATTEMPTS - attempts
        }
      });

      return {
        isLocked: false,
        failedAttempts: attempts,
        remainingAttempts: MAX_FAILED_ATTEMPTS - attempts
      };
    } catch (error) {
      logger.error('Error recording failed login attempt', { error, identifier });
      // Fallback: return unlocked status on error
      return {
        isLocked: false,
        failedAttempts: 0,
        remainingAttempts: MAX_FAILED_ATTEMPTS
      };
    }
  }

  /**
   * Check if account is currently locked
   * 
   * @param identifier - Username or email
   * @returns Lockout status
   */
  async checkLockoutStatus(identifier: string): Promise<LockoutStatus> {
    const client = this.getClient();
    
    if (!client) {
      return {
        isLocked: false,
        failedAttempts: 0,
        remainingAttempts: MAX_FAILED_ATTEMPTS
      };
    }

    const attemptsKey = this.getAttemptsKey(identifier);
    const lockoutKey = this.getLockoutKey(identifier);

    try {
      // Check if account is locked
      const lockoutData = await client.get(lockoutKey);
      
      if (lockoutData) {
        const lockoutExpiresAt = new Date(lockoutData);
        const now = new Date();
        
        if (lockoutExpiresAt > now) {
          const lockoutTimeRemaining = Math.ceil(
            (lockoutExpiresAt.getTime() - now.getTime()) / 1000
          );

          const failedAttempts = await client.get(attemptsKey);

          return {
            isLocked: true,
            failedAttempts: failedAttempts ? parseInt(failedAttempts) : MAX_FAILED_ATTEMPTS,
            remainingAttempts: 0,
            lockoutExpiresAt,
            lockoutTimeRemaining
          };
        }
      }

      // Not locked, check failed attempts
      const failedAttempts = await client.get(attemptsKey);
      const attempts = failedAttempts ? parseInt(failedAttempts) : 0;

      return {
        isLocked: false,
        failedAttempts: attempts,
        remainingAttempts: MAX_FAILED_ATTEMPTS - attempts
      };
    } catch (error) {
      logger.error('Error checking lockout status', { error, identifier });
      return {
        isLocked: false,
        failedAttempts: 0,
        remainingAttempts: MAX_FAILED_ATTEMPTS
      };
    }
  }

  /**
   * Reset failed login attempts after successful login
   * Removes both attempts counter and lockout status
   * 
   * @param identifier - Username or email
   * @param userId - User ID for logging
   */
  async resetFailedAttempts(identifier: string, userId?: number): Promise<void> {
    const client = this.getClient();
    
    if (!client) {
      return;
    }

    const attemptsKey = this.getAttemptsKey(identifier);
    const lockoutKey = this.getLockoutKey(identifier);

    try {
      // Delete both keys
      await Promise.all([
        client.del(attemptsKey),
        client.del(lockoutKey)
      ]);

      logger.info('Failed login attempts reset', {
        identifier,
        userId
      });
    } catch (error) {
      logger.error('Error resetting failed attempts', { error, identifier });
    }
  }

  /**
   * Manually unlock an account (admin action)
   * 
   * @param identifier - Username or email
   * @param adminUserId - Admin user ID performing the unlock
   */
  async unlockAccount(identifier: string, adminUserId: number): Promise<void> {
    const client = this.getClient();
    
    if (!client) {
      return;
    }

    const attemptsKey = this.getAttemptsKey(identifier);
    const lockoutKey = this.getLockoutKey(identifier);

    try {
      // Delete both keys
      await Promise.all([
        client.del(attemptsKey),
        client.del(lockoutKey)
      ]);

      // Log security event
      logSecurityEvent({
        event: SECURITY_EVENTS.ADMIN_ACTION,
        userId: adminUserId,
        outcome: 'success',
        action: 'unlock_account',
        details: {
          targetIdentifier: identifier,
          reason: 'manual_unlock'
        }
      });

      logger.info('Account manually unlocked by admin', {
        identifier,
        adminUserId
      });
    } catch (error) {
      logger.error('Error unlocking account', { error, identifier });
      throw error;
    }
  }

  /**
   * Get lockout configuration
   */
  getConfiguration() {
    return {
      maxFailedAttempts: MAX_FAILED_ATTEMPTS,
      attemptWindowSeconds: ATTEMPT_WINDOW_SECONDS,
      lockoutDurationSeconds: LOCKOUT_DURATION_SECONDS,
      attemptWindowMinutes: ATTEMPT_WINDOW_SECONDS / 60,
      lockoutDurationMinutes: LOCKOUT_DURATION_SECONDS / 60
    };
  }
}

export default new AccountLockoutService();
