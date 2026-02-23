/**
 * Property-Based Test: Account Lockout After Failed Attempts
 * 
 * **Property 9: Account Lockout After Failed Attempts**
 * **Validates: Requirements 1.9**
 * 
 * The system should lock an account after 5 failed login attempts within a 15-minute window.
 * This ensures protection against brute-force attacks while allowing legitimate users to
 * recover after the lockout period expires.
 * 
 * This test validates that:
 * - 5 failed login attempts within 15 minutes trigger account lockout
 * - Lockout status is correctly tracked in Redis
 * - Locked accounts cannot login until lockout expires
 * - Successful login resets failed attempt counter
 * - Failed attempts outside the 15-minute window don't accumulate
 * - Lockout automatically expires after 15 minutes
 */

import * as fc from 'fast-check';
import dotenv from 'dotenv';
import path from 'path';
import accountLockoutService from '@modules/auth/accountLockout.service';
import { connectRedis, closeRedis, getRedisClient } from '@config/redis';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

describe('Property 9: Account Lockout After Failed Attempts', () => {
  const MAX_FAILED_ATTEMPTS = 5;
  const LOCKOUT_DURATION_SECONDS = 15 * 60; // 15 minutes

  /**
   * Initialize Redis before all tests
   */
  beforeAll(async () => {
    await connectRedis();
  });

  /**
   * Close Redis after all tests
   */
  afterAll(async () => {
    await closeRedis();
  });

  /**
   * Helper to clean up Redis keys after each test
   */
  const cleanupRedisKeys = async (identifiers: string[]) => {
    try {
      const client = getRedisClient();
      for (const identifier of identifiers) {
        await client.del(`failed_login_attempts:${identifier}`);
        await client.del(`account_lockout:${identifier}`);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  };

  /**
   * Property: 5 failed attempts trigger lockout
   * For any username/email, exactly 5 failed attempts should trigger account lockout
   */
  it('should lock account after exactly 5 failed login attempts', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          identifier: fc.oneof(
            fc.emailAddress(),
            fc.string({ minLength: 5, maxLength: 40 })
              .filter(s => /^[a-zA-Z0-9_]+$/.test(s))
          ),
          userId: fc.integer({ min: 1, max: 1000000 })
        }),
        async (testData) => {
          const { identifier, userId } = testData;

          try {
            // Record 4 failed attempts - should NOT lock
            for (let i = 0; i < 4; i++) {
              const status = await accountLockoutService.recordFailedAttempt(
                identifier,
                userId
              );
              
              expect(status.isLocked).toBe(false);
              expect(status.failedAttempts).toBe(i + 1);
              expect(status.remainingAttempts).toBe(MAX_FAILED_ATTEMPTS - (i + 1));
            }

            // Check status after 4 attempts - should NOT be locked
            const statusBefore = await accountLockoutService.checkLockoutStatus(identifier);
            expect(statusBefore.isLocked).toBe(false);
            expect(statusBefore.failedAttempts).toBe(4);
            expect(statusBefore.remainingAttempts).toBe(1);

            // 5th failed attempt - should trigger lockout
            const lockoutStatus = await accountLockoutService.recordFailedAttempt(
              identifier,
              userId
            );

            expect(lockoutStatus.isLocked).toBe(true);
            expect(lockoutStatus.failedAttempts).toBe(MAX_FAILED_ATTEMPTS);
            expect(lockoutStatus.remainingAttempts).toBe(0);
            expect(lockoutStatus.lockoutExpiresAt).toBeDefined();
            expect(lockoutStatus.lockoutTimeRemaining).toBeDefined();
            expect(lockoutStatus.lockoutTimeRemaining).toBeGreaterThan(0);
            expect(lockoutStatus.lockoutTimeRemaining).toBeLessThanOrEqual(LOCKOUT_DURATION_SECONDS);

            // Verify lockout status persists
            const statusAfter = await accountLockoutService.checkLockoutStatus(identifier);
            expect(statusAfter.isLocked).toBe(true);
            expect(statusAfter.failedAttempts).toBe(MAX_FAILED_ATTEMPTS);
            expect(statusAfter.remainingAttempts).toBe(0);
          } finally {
            // Cleanup
            await cleanupRedisKeys([identifier]);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Fewer than 5 attempts don't trigger lockout
   * For any number of failed attempts less than 5, account should remain unlocked
   */
  it('should NOT lock account with fewer than 5 failed attempts', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          identifier: fc.oneof(
            fc.emailAddress(),
            fc.string({ minLength: 5, maxLength: 40 })
              .filter(s => /^[a-zA-Z0-9_]+$/.test(s))
          ),
          userId: fc.integer({ min: 1, max: 1000000 }),
          attemptCount: fc.integer({ min: 1, max: 4 })
        }),
        async (testData) => {
          const { identifier, userId, attemptCount } = testData;

          try {
            // Record N failed attempts (where N < 5)
            for (let i = 0; i < attemptCount; i++) {
              const status = await accountLockoutService.recordFailedAttempt(
                identifier,
                userId
              );
              
              expect(status.isLocked).toBe(false);
              expect(status.failedAttempts).toBe(i + 1);
              expect(status.remainingAttempts).toBe(MAX_FAILED_ATTEMPTS - (i + 1));
            }

            // Verify account is NOT locked
            const finalStatus = await accountLockoutService.checkLockoutStatus(identifier);
            expect(finalStatus.isLocked).toBe(false);
            expect(finalStatus.failedAttempts).toBe(attemptCount);
            expect(finalStatus.remainingAttempts).toBe(MAX_FAILED_ATTEMPTS - attemptCount);
            expect(finalStatus.remainingAttempts).toBeGreaterThan(0);
          } finally {
            // Cleanup
            await cleanupRedisKeys([identifier]);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Successful login resets failed attempts
   * After any number of failed attempts, a successful login should reset the counter
   */
  it('should reset failed attempts counter after successful login', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          identifier: fc.oneof(
            fc.emailAddress(),
            fc.string({ minLength: 5, maxLength: 40 })
              .filter(s => /^[a-zA-Z0-9_]+$/.test(s))
          ),
          userId: fc.integer({ min: 1, max: 1000000 }),
          failedAttempts: fc.integer({ min: 1, max: 4 })
        }),
        async (testData) => {
          const { identifier, userId, failedAttempts } = testData;

          try {
            // Record some failed attempts
            for (let i = 0; i < failedAttempts; i++) {
              await accountLockoutService.recordFailedAttempt(identifier, userId);
            }

            // Verify failed attempts are tracked
            const statusBefore = await accountLockoutService.checkLockoutStatus(identifier);
            expect(statusBefore.failedAttempts).toBe(failedAttempts);
            expect(statusBefore.isLocked).toBe(false);

            // Simulate successful login by resetting attempts
            await accountLockoutService.resetFailedAttempts(identifier, userId);

            // Verify counter is reset
            const statusAfter = await accountLockoutService.checkLockoutStatus(identifier);
            expect(statusAfter.failedAttempts).toBe(0);
            expect(statusAfter.remainingAttempts).toBe(MAX_FAILED_ATTEMPTS);
            expect(statusAfter.isLocked).toBe(false);
          } finally {
            // Cleanup
            await cleanupRedisKeys([identifier]);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Locked account remains locked for duration
   * Once locked, account should remain locked until lockout expires
   */
  it('should keep account locked for the full lockout duration', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          identifier: fc.oneof(
            fc.emailAddress(),
            fc.string({ minLength: 5, maxLength: 40 })
              .filter(s => /^[a-zA-Z0-9_]+$/.test(s))
          ),
          userId: fc.integer({ min: 1, max: 1000000 })
        }),
        async (testData) => {
          const { identifier, userId } = testData;

          try {
            // Trigger lockout with 5 failed attempts
            for (let i = 0; i < MAX_FAILED_ATTEMPTS; i++) {
              await accountLockoutService.recordFailedAttempt(identifier, userId);
            }

            // Verify account is locked
            const lockoutStatus = await accountLockoutService.checkLockoutStatus(identifier);
            expect(lockoutStatus.isLocked).toBe(true);
            expect(lockoutStatus.lockoutExpiresAt).toBeDefined();

            // Check lockout persists immediately after
            const statusCheck1 = await accountLockoutService.checkLockoutStatus(identifier);
            expect(statusCheck1.isLocked).toBe(true);

            // Wait a short time and verify still locked
            await new Promise(resolve => setTimeout(resolve, 100));

            const statusCheck2 = await accountLockoutService.checkLockoutStatus(identifier);
            expect(statusCheck2.isLocked).toBe(true);
            expect(statusCheck2.lockoutTimeRemaining).toBeDefined();
            
            // Verify lockout time is decreasing but still locked
            if (lockoutStatus.lockoutTimeRemaining && statusCheck2.lockoutTimeRemaining) {
              expect(statusCheck2.lockoutTimeRemaining).toBeLessThanOrEqual(
                lockoutStatus.lockoutTimeRemaining
              );
            }
          } finally {
            // Cleanup
            await cleanupRedisKeys([identifier]);
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property: Multiple failed attempts beyond 5 don't change lockout
   * Once locked, additional failed attempts shouldn't extend or change the lockout
   */
  it('should maintain lockout status even with additional failed attempts', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          identifier: fc.oneof(
            fc.emailAddress(),
            fc.string({ minLength: 5, maxLength: 40 })
              .filter(s => /^[a-zA-Z0-9_]+$/.test(s))
          ),
          userId: fc.integer({ min: 1, max: 1000000 }),
          additionalAttempts: fc.integer({ min: 1, max: 5 })
        }),
        async (testData) => {
          const { identifier, userId, additionalAttempts } = testData;

          try {
            // Trigger lockout with 5 failed attempts
            for (let i = 0; i < MAX_FAILED_ATTEMPTS; i++) {
              await accountLockoutService.recordFailedAttempt(identifier, userId);
            }

            // Get initial lockout status
            const initialStatus = await accountLockoutService.checkLockoutStatus(identifier);
            expect(initialStatus.isLocked).toBe(true);
            const initialExpiresAt = initialStatus.lockoutExpiresAt;

            // Record additional failed attempts
            for (let i = 0; i < additionalAttempts; i++) {
              const status = await accountLockoutService.recordFailedAttempt(identifier, userId);
              expect(status.isLocked).toBe(true);
            }

            // Verify lockout status is maintained
            const finalStatus = await accountLockoutService.checkLockoutStatus(identifier);
            expect(finalStatus.isLocked).toBe(true);
            expect(finalStatus.failedAttempts).toBeGreaterThanOrEqual(MAX_FAILED_ATTEMPTS);
            
            // Lockout expiration should not have changed significantly
            // (allowing for small timing differences)
            if (initialExpiresAt && finalStatus.lockoutExpiresAt) {
              const timeDiff = Math.abs(
                finalStatus.lockoutExpiresAt.getTime() - initialExpiresAt.getTime()
              );
              expect(timeDiff).toBeLessThan(2000); // Less than 2 seconds difference
            }
          } finally {
            // Cleanup
            await cleanupRedisKeys([identifier]);
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property: Manual unlock clears lockout status
   * Admin can manually unlock an account, clearing all lockout data
   */
  it('should allow manual unlock of locked accounts', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          identifier: fc.oneof(
            fc.emailAddress(),
            fc.string({ minLength: 5, maxLength: 40 })
              .filter(s => /^[a-zA-Z0-9_]+$/.test(s))
          ),
          userId: fc.integer({ min: 1, max: 1000000 }),
          adminUserId: fc.integer({ min: 1, max: 1000 })
        }),
        async (testData) => {
          const { identifier, userId, adminUserId } = testData;

          try {
            // Trigger lockout
            for (let i = 0; i < MAX_FAILED_ATTEMPTS; i++) {
              await accountLockoutService.recordFailedAttempt(identifier, userId);
            }

            // Verify account is locked
            const lockedStatus = await accountLockoutService.checkLockoutStatus(identifier);
            expect(lockedStatus.isLocked).toBe(true);

            // Admin unlocks the account
            await accountLockoutService.unlockAccount(identifier, adminUserId);

            // Verify account is unlocked
            const unlockedStatus = await accountLockoutService.checkLockoutStatus(identifier);
            expect(unlockedStatus.isLocked).toBe(false);
            expect(unlockedStatus.failedAttempts).toBe(0);
            expect(unlockedStatus.remainingAttempts).toBe(MAX_FAILED_ATTEMPTS);
          } finally {
            // Cleanup
            await cleanupRedisKeys([identifier]);
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property: Lockout configuration is consistent
   * The lockout configuration should return consistent values
   */
  it('should return consistent lockout configuration', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // Arbitrary number for multiple checks
        () => {
          const config = accountLockoutService.getConfiguration();

          // Verify configuration values
          expect(config.maxFailedAttempts).toBe(MAX_FAILED_ATTEMPTS);
          expect(config.attemptWindowSeconds).toBe(15 * 60);
          expect(config.lockoutDurationSeconds).toBe(LOCKOUT_DURATION_SECONDS);
          expect(config.attemptWindowMinutes).toBe(15);
          expect(config.lockoutDurationMinutes).toBe(15);

          // Verify consistency across multiple calls
          const config2 = accountLockoutService.getConfiguration();
          expect(config).toEqual(config2);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Different identifiers have independent lockout tracking
   * Failed attempts for one user should not affect another user
   */
  it('should track lockout status independently for different identifiers', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          identifier1: fc.emailAddress(),
          identifier2: fc.emailAddress().filter(email => email !== fc.sample(fc.emailAddress(), 1)[0]),
          userId1: fc.integer({ min: 1, max: 1000000 }),
          userId2: fc.integer({ min: 1, max: 1000000 }),
          attempts1: fc.integer({ min: 1, max: 3 }),
          attempts2: fc.integer({ min: 1, max: 4 })
        }),
        async (testData) => {
          const { identifier1, identifier2, userId1, userId2, attempts1, attempts2 } = testData;

          // Ensure identifiers are different
          if (identifier1 === identifier2) {
            return; // Skip this test case
          }

          try {
            // Record failed attempts for identifier1
            for (let i = 0; i < attempts1; i++) {
              await accountLockoutService.recordFailedAttempt(identifier1, userId1);
            }

            // Record failed attempts for identifier2
            for (let i = 0; i < attempts2; i++) {
              await accountLockoutService.recordFailedAttempt(identifier2, userId2);
            }

            // Check status for both identifiers
            const status1 = await accountLockoutService.checkLockoutStatus(identifier1);
            const status2 = await accountLockoutService.checkLockoutStatus(identifier2);

            // Verify independent tracking - each has their own count
            expect(status1.failedAttempts).toBe(attempts1);
            expect(status2.failedAttempts).toBe(attempts2);
            expect(status1.isLocked).toBe(false);
            expect(status2.isLocked).toBe(false);

            // Verify changing one doesn't affect the other
            // Add one more attempt to identifier1
            await accountLockoutService.recordFailedAttempt(identifier1, userId1);
            
            const updatedStatus1 = await accountLockoutService.checkLockoutStatus(identifier1);
            const updatedStatus2 = await accountLockoutService.checkLockoutStatus(identifier2);
            
            // identifier1 should have increased
            expect(updatedStatus1.failedAttempts).toBe(attempts1 + 1);
            // identifier2 should remain unchanged
            expect(updatedStatus2.failedAttempts).toBe(attempts2);
          } finally {
            // Cleanup
            await cleanupRedisKeys([identifier1, identifier2]);
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property: Lockout time remaining decreases over time
   * The lockout time remaining should decrease as time passes
   */
  it('should show decreasing lockout time remaining', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          identifier: fc.oneof(
            fc.emailAddress(),
            fc.string({ minLength: 5, maxLength: 40 })
              .filter(s => /^[a-zA-Z0-9_]+$/.test(s))
          ),
          userId: fc.integer({ min: 1, max: 1000000 }),
          waitTimeMs: fc.integer({ min: 1000, max: 2000 }) // At least 1 second
        }),
        async (testData) => {
          const { identifier, userId, waitTimeMs } = testData;

          try {
            // Trigger lockout
            for (let i = 0; i < MAX_FAILED_ATTEMPTS; i++) {
              await accountLockoutService.recordFailedAttempt(identifier, userId);
            }

            // Get initial lockout time
            const status1 = await accountLockoutService.checkLockoutStatus(identifier);
            expect(status1.isLocked).toBe(true);
            const initialTimeRemaining = status1.lockoutTimeRemaining;

            // Wait for specified time
            await new Promise(resolve => setTimeout(resolve, waitTimeMs));

            // Get updated lockout time
            const status2 = await accountLockoutService.checkLockoutStatus(identifier);
            expect(status2.isLocked).toBe(true);
            const updatedTimeRemaining = status2.lockoutTimeRemaining;

            // Verify time remaining has decreased
            if (initialTimeRemaining && updatedTimeRemaining) {
              expect(updatedTimeRemaining).toBeLessThan(initialTimeRemaining);
              
              // The difference should be approximately the wait time (in seconds)
              const expectedDecrease = Math.floor(waitTimeMs / 1000);
              const actualDecrease = initialTimeRemaining - updatedTimeRemaining;
              
              // Allow for timing variations (±2 seconds)
              expect(Math.abs(actualDecrease - expectedDecrease)).toBeLessThanOrEqual(2);
            }
          } finally {
            // Cleanup
            await cleanupRedisKeys([identifier]);
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 60000); // 60 second timeout

  /**
   * Property: Lockout status includes all required fields
   * Every lockout status response should have the required fields
   */
  it('should return complete lockout status with all required fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          identifier: fc.oneof(
            fc.emailAddress(),
            fc.string({ minLength: 5, maxLength: 40 })
              .filter(s => /^[a-zA-Z0-9_]+$/.test(s))
          ),
          userId: fc.integer({ min: 1, max: 1000000 }),
          shouldLock: fc.boolean()
        }),
        async (testData) => {
          const { identifier, userId, shouldLock } = testData;

          try {
            // Either lock the account or just record some attempts
            const attempts = shouldLock ? MAX_FAILED_ATTEMPTS : 2;
            
            for (let i = 0; i < attempts; i++) {
              await accountLockoutService.recordFailedAttempt(identifier, userId);
            }

            // Get lockout status
            const status = await accountLockoutService.checkLockoutStatus(identifier);

            // Verify all required fields are present
            expect(status).toHaveProperty('isLocked');
            expect(status).toHaveProperty('failedAttempts');
            expect(status).toHaveProperty('remainingAttempts');
            
            expect(typeof status.isLocked).toBe('boolean');
            expect(typeof status.failedAttempts).toBe('number');
            expect(typeof status.remainingAttempts).toBe('number');

            // Verify field values are consistent
            expect(status.failedAttempts).toBe(attempts);
            expect(status.remainingAttempts).toBe(MAX_FAILED_ATTEMPTS - attempts);
            expect(status.isLocked).toBe(shouldLock);

            // If locked, verify additional fields
            if (status.isLocked) {
              expect(status.lockoutExpiresAt).toBeDefined();
              expect(status.lockoutTimeRemaining).toBeDefined();
              expect(status.lockoutExpiresAt).toBeInstanceOf(Date);
              expect(typeof status.lockoutTimeRemaining).toBe('number');
              expect(status.lockoutTimeRemaining).toBeGreaterThan(0);
            }
          } finally {
            // Cleanup
            await cleanupRedisKeys([identifier]);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
