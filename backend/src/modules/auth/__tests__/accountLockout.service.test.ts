import accountLockoutService from '../accountLockout.service';
import { getRedisClient } from '@config/redis';
import { logger, logSecurityEvent } from '@utils/logger';

// Mock dependencies
jest.mock('@config/redis');
jest.mock('@utils/logger');

describe('AccountLockoutService', () => {
  let mockRedisClient: any;

  beforeEach(() => {
    // Setup mock Redis client
    mockRedisClient = {
      incr: jest.fn(),
      expire: jest.fn(),
      setEx: jest.fn(),
      get: jest.fn(),
      del: jest.fn()
    };

    (getRedisClient as jest.Mock).mockReturnValue(mockRedisClient);
    jest.clearAllMocks();
  });

  describe('recordFailedAttempt', () => {
    it('should record first failed attempt and set expiration', async () => {
      mockRedisClient.incr.mockResolvedValue(1);

      const result = await accountLockoutService.recordFailedAttempt('testuser');

      expect(mockRedisClient.incr).toHaveBeenCalledWith('failed_login_attempts:testuser');
      expect(mockRedisClient.expire).toHaveBeenCalledWith('failed_login_attempts:testuser', 900); // 15 minutes
      expect(result).toEqual({
        isLocked: false,
        failedAttempts: 1,
        remainingAttempts: 4
      });
    });

    it('should increment failed attempts without setting expiration on subsequent attempts', async () => {
      mockRedisClient.incr.mockResolvedValue(3);

      const result = await accountLockoutService.recordFailedAttempt('testuser');

      expect(mockRedisClient.incr).toHaveBeenCalledWith('failed_login_attempts:testuser');
      expect(mockRedisClient.expire).not.toHaveBeenCalled(); // Only set on first attempt
      expect(result).toEqual({
        isLocked: false,
        failedAttempts: 3,
        remainingAttempts: 2
      });
    });

    it('should lock account after 5 failed attempts', async () => {
      mockRedisClient.incr.mockResolvedValue(5);

      const result = await accountLockoutService.recordFailedAttempt('testuser', 123);

      expect(mockRedisClient.incr).toHaveBeenCalledWith('failed_login_attempts:testuser');
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'account_lockout:testuser',
        900, // 15 minutes
        expect.any(String) // ISO date string
      );
      expect(logSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'account_lockout',
          userId: 123,
          userEmail: 'testuser',
          outcome: 'failure'
        })
      );
      expect(result.isLocked).toBe(true);
      expect(result.failedAttempts).toBe(5);
      expect(result.remainingAttempts).toBe(0);
      expect(result.lockoutExpiresAt).toBeInstanceOf(Date);
      expect(result.lockoutTimeRemaining).toBe(900);
    });

    it('should log security event for failed attempts', async () => {
      mockRedisClient.incr.mockResolvedValue(2);

      await accountLockoutService.recordFailedAttempt('testuser@example.com', 456);

      expect(logSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'authentication_failure',
          userId: 456,
          userEmail: 'testuser@example.com',
          outcome: 'failure',
          details: {
            failedAttempts: 2,
            remainingAttempts: 3
          }
        })
      );
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedisClient.incr.mockRejectedValue(new Error('Redis connection failed'));

      const result = await accountLockoutService.recordFailedAttempt('testuser');

      expect(logger.error).toHaveBeenCalledWith(
        'Error recording failed login attempt',
        expect.any(Object)
      );
      expect(result).toEqual({
        isLocked: false,
        failedAttempts: 0,
        remainingAttempts: 5
      });
    });

    it('should handle Redis unavailable gracefully', async () => {
      (getRedisClient as jest.Mock).mockImplementation(() => {
        throw new Error('Redis not initialized');
      });

      const result = await accountLockoutService.recordFailedAttempt('testuser');

      expect(logger.warn).toHaveBeenCalledWith(
        'Redis not available for account lockout tracking',
        expect.any(Object)
      );
      expect(result).toEqual({
        isLocked: false,
        failedAttempts: 0,
        remainingAttempts: 5
      });
    });
  });

  describe('checkLockoutStatus', () => {
    it('should return locked status when account is locked', async () => {
      const lockoutTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
      mockRedisClient.get
        .mockResolvedValueOnce(lockoutTime.toISOString()) // lockout key
        .mockResolvedValueOnce('5'); // attempts key

      const result = await accountLockoutService.checkLockoutStatus('testuser');

      expect(mockRedisClient.get).toHaveBeenCalledWith('account_lockout:testuser');
      expect(mockRedisClient.get).toHaveBeenCalledWith('failed_login_attempts:testuser');
      expect(result.isLocked).toBe(true);
      expect(result.failedAttempts).toBe(5);
      expect(result.remainingAttempts).toBe(0);
      expect(result.lockoutExpiresAt).toBeInstanceOf(Date);
      expect(result.lockoutTimeRemaining).toBeGreaterThan(0);
    });

    it('should return unlocked status when lockout has expired', async () => {
      const expiredLockoutTime = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      mockRedisClient.get
        .mockResolvedValueOnce(expiredLockoutTime.toISOString()) // lockout key (expired)
        .mockResolvedValueOnce('3'); // attempts key

      const result = await accountLockoutService.checkLockoutStatus('testuser');

      expect(result.isLocked).toBe(false);
      expect(result.failedAttempts).toBe(3);
      expect(result.remainingAttempts).toBe(2);
    });

    it('should return unlocked status with no failed attempts', async () => {
      mockRedisClient.get
        .mockResolvedValueOnce(null) // no lockout
        .mockResolvedValueOnce(null); // no attempts

      const result = await accountLockoutService.checkLockoutStatus('testuser');

      expect(result).toEqual({
        isLocked: false,
        failedAttempts: 0,
        remainingAttempts: 5
      });
    });

    it('should return unlocked status with some failed attempts', async () => {
      mockRedisClient.get
        .mockResolvedValueOnce(null) // no lockout
        .mockResolvedValueOnce('2'); // 2 attempts

      const result = await accountLockoutService.checkLockoutStatus('testuser');

      expect(result).toEqual({
        isLocked: false,
        failedAttempts: 2,
        remainingAttempts: 3
      });
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis error'));

      const result = await accountLockoutService.checkLockoutStatus('testuser');

      expect(logger.error).toHaveBeenCalledWith(
        'Error checking lockout status',
        expect.any(Object)
      );
      expect(result).toEqual({
        isLocked: false,
        failedAttempts: 0,
        remainingAttempts: 5
      });
    });
  });

  describe('resetFailedAttempts', () => {
    it('should delete both attempts and lockout keys', async () => {
      mockRedisClient.del.mockResolvedValue(1);

      await accountLockoutService.resetFailedAttempts('testuser', 123);

      expect(mockRedisClient.del).toHaveBeenCalledWith('failed_login_attempts:testuser');
      expect(mockRedisClient.del).toHaveBeenCalledWith('account_lockout:testuser');
      expect(logger.info).toHaveBeenCalledWith(
        'Failed login attempts reset',
        expect.objectContaining({
          identifier: 'testuser',
          userId: 123
        })
      );
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedisClient.del.mockRejectedValue(new Error('Redis error'));

      await accountLockoutService.resetFailedAttempts('testuser');

      expect(logger.error).toHaveBeenCalledWith(
        'Error resetting failed attempts',
        expect.any(Object)
      );
    });

    it('should handle Redis unavailable gracefully', async () => {
      (getRedisClient as jest.Mock).mockImplementation(() => {
        throw new Error('Redis not initialized');
      });

      await accountLockoutService.resetFailedAttempts('testuser');

      expect(logger.warn).toHaveBeenCalledWith(
        'Redis not available for account lockout tracking',
        expect.any(Object)
      );
    });
  });

  describe('unlockAccount', () => {
    it('should unlock account and log admin action', async () => {
      mockRedisClient.del.mockResolvedValue(1);

      await accountLockoutService.unlockAccount('testuser', 999);

      expect(mockRedisClient.del).toHaveBeenCalledWith('failed_login_attempts:testuser');
      expect(mockRedisClient.del).toHaveBeenCalledWith('account_lockout:testuser');
      expect(logSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'administrative_action',
          userId: 999,
          outcome: 'success',
          action: 'unlock_account',
          details: {
            targetIdentifier: 'testuser',
            reason: 'manual_unlock'
          }
        })
      );
      expect(logger.info).toHaveBeenCalledWith(
        'Account manually unlocked by admin',
        expect.objectContaining({
          identifier: 'testuser',
          adminUserId: 999
        })
      );
    });

    it('should throw error if Redis operation fails', async () => {
      mockRedisClient.del.mockRejectedValue(new Error('Redis error'));

      await expect(
        accountLockoutService.unlockAccount('testuser', 999)
      ).rejects.toThrow('Redis error');

      expect(logger.error).toHaveBeenCalledWith(
        'Error unlocking account',
        expect.any(Object)
      );
    });
  });

  describe('getConfiguration', () => {
    it('should return lockout configuration', () => {
      const config = accountLockoutService.getConfiguration();

      expect(config).toEqual({
        maxFailedAttempts: 5,
        attemptWindowSeconds: 900,
        lockoutDurationSeconds: 900,
        attemptWindowMinutes: 15,
        lockoutDurationMinutes: 15
      });
    });
  });
});
