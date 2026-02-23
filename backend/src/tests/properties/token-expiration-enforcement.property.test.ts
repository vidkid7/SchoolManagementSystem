/**
 * Property-Based Test: Token Expiration Enforcement
 * 
 * **Property 8: Token Expiration Enforcement**
 * **Validates: Requirements 1.3**
 * 
 * For any JWT token that has expired, the system should reject it with 
 * 401 Unauthorized error. This ensures that expired tokens cannot be used
 * to access protected resources.
 * 
 * This test validates that:
 * - Expired access tokens are rejected with AuthenticationError
 * - Expired refresh tokens are rejected with AuthenticationError
 * - Valid (non-expired) tokens are accepted
 * - Token expiration is enforced at verification time
 * - Error messages clearly indicate token expiration
 */

import * as fc from 'fast-check';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import jwtService, { JWTPayload } from '@modules/auth/jwt.service';
import { UserRole } from '@models/User.model';
import { AuthenticationError } from '@middleware/errorHandler';
import { env } from '@config/env';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

describe('Property 8: Token Expiration Enforcement', () => {
  /**
   * Helper function to create an expired access token
   * Creates a token with negative expiry (already expired)
   */
  const createExpiredAccessToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
    // Create token that expired 1 second ago
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: '-1s'
    });
  };

  /**
   * Helper function to create an expired refresh token
   * Creates a token with negative expiry (already expired)
   */
  const createExpiredRefreshToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
    // Create token that expired 1 second ago
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: '-1s'
    });
  };

  /**
   * Helper function to create a token with custom expiry
   */
  const createTokenWithExpiry = (
    payload: Omit<JWTPayload, 'iat' | 'exp'>,
    expirySeconds: number,
    secret: string
  ): string => {
    return jwt.sign(payload, secret, {
      expiresIn: `${expirySeconds}s`
    });
  };

  /**
   * Property: Expired access tokens are rejected
   * For any user data, an expired access token should be rejected with AuthenticationError
   */
  it('should reject expired access tokens with AuthenticationError', () => {
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.integer({ min: 1, max: 1000000 }),
          username: fc.string({ minLength: 5, maxLength: 40 })
            .filter(s => /^[a-zA-Z0-9_]+$/.test(s)),
          email: fc.emailAddress(),
          role: fc.constantFrom(...Object.values(UserRole)),
          permissions: fc.option(
            fc.array(
              fc.constantFrom(
                'read:students',
                'write:students',
                'read:attendance',
                'write:attendance',
                'read:exams',
                'write:exams'
              ),
              { minLength: 0, maxLength: 5 }
            ),
            { nil: undefined }
          )
        }),
        (userData) => {
          // Create expired access token
          const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
            userId: userData.userId,
            username: userData.username,
            email: userData.email,
            role: userData.role,
            permissions: userData.permissions
          };

          const expiredToken = createExpiredAccessToken(payload);

          // Verify token is a string
          expect(typeof expiredToken).toBe('string');
          expect(expiredToken.length).toBeGreaterThan(0);

          // Attempt to verify expired token should throw AuthenticationError
          expect(() => {
            jwtService.verifyAccessToken(expiredToken);
          }).toThrow(AuthenticationError);

          // Verify the error message indicates expiration
          try {
            jwtService.verifyAccessToken(expiredToken);
            // Should not reach here
            expect(true).toBe(false);
          } catch (error) {
            expect(error).toBeInstanceOf(AuthenticationError);
            expect((error as AuthenticationError).message).toContain('expired');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Expired refresh tokens are rejected
   * For any user data, an expired refresh token should be rejected with AuthenticationError
   */
  it('should reject expired refresh tokens with AuthenticationError', () => {
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.integer({ min: 1, max: 1000000 }),
          username: fc.string({ minLength: 5, maxLength: 40 })
            .filter(s => /^[a-zA-Z0-9_]+$/.test(s)),
          email: fc.emailAddress(),
          role: fc.constantFrom(...Object.values(UserRole)),
          permissions: fc.option(
            fc.array(
              fc.constantFrom(
                'read:students',
                'write:students',
                'read:staff',
                'write:staff'
              ),
              { minLength: 0, maxLength: 3 }
            ),
            { nil: undefined }
          )
        }),
        (userData) => {
          // Create expired refresh token
          const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
            userId: userData.userId,
            username: userData.username,
            email: userData.email,
            role: userData.role,
            permissions: userData.permissions
          };

          const expiredToken = createExpiredRefreshToken(payload);

          // Verify token is a string
          expect(typeof expiredToken).toBe('string');
          expect(expiredToken.length).toBeGreaterThan(0);

          // Attempt to verify expired token should throw AuthenticationError
          expect(() => {
            jwtService.verifyRefreshToken(expiredToken);
          }).toThrow(AuthenticationError);

          // Verify the error message indicates expiration
          try {
            jwtService.verifyRefreshToken(expiredToken);
            // Should not reach here
            expect(true).toBe(false);
          } catch (error) {
            expect(error).toBeInstanceOf(AuthenticationError);
            expect((error as AuthenticationError).message).toContain('expired');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Valid (non-expired) tokens are accepted
   * For any user data, a valid non-expired token should be accepted
   */
  it('should accept valid non-expired access tokens', () => {
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.integer({ min: 1, max: 1000000 }),
          username: fc.string({ minLength: 5, maxLength: 40 })
            .filter(s => /^[a-zA-Z0-9_]+$/.test(s)),
          email: fc.emailAddress(),
          role: fc.constantFrom(...Object.values(UserRole)),
          permissions: fc.option(
            fc.array(
              fc.constantFrom(
                'read:students',
                'write:students',
                'read:exams',
                'write:exams'
              ),
              { minLength: 1, maxLength: 4 }
            ),
            { nil: undefined }
          )
        }),
        (userData) => {
          // Generate valid access token using the service
          const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
            userId: userData.userId,
            username: userData.username,
            email: userData.email,
            role: userData.role,
            permissions: userData.permissions
          };

          const validToken = jwtService.generateAccessToken(payload);

          // Verify token should not throw
          expect(() => {
            jwtService.verifyAccessToken(validToken);
          }).not.toThrow();

          // Verify token and check payload
          const verifiedPayload = jwtService.verifyAccessToken(validToken);
          expect(verifiedPayload.userId).toBe(userData.userId);
          expect(verifiedPayload.username).toBe(userData.username);
          expect(verifiedPayload.email).toBe(userData.email);
          expect(verifiedPayload.role).toBe(userData.role);

          // Verify expiration is in the future
          expect(verifiedPayload.exp).toBeDefined();
          const now = Math.floor(Date.now() / 1000);
          expect(verifiedPayload.exp!).toBeGreaterThan(now);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Tokens with various expiration times
   * Test tokens that expire at different times in the past
   */
  it('should reject tokens expired at various times in the past', () => {
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.integer({ min: 1, max: 1000000 }),
          username: fc.string({ minLength: 5, maxLength: 40 })
            .filter(s => /^[a-zA-Z0-9_]+$/.test(s)),
          email: fc.emailAddress(),
          role: fc.constantFrom(...Object.values(UserRole)),
          // Generate negative expiry times (expired in the past)
          expirySecondsAgo: fc.integer({ min: 1, max: 3600 }) // 1 second to 1 hour ago
        }),
        (userData) => {
          // Create token that expired N seconds ago
          const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
            userId: userData.userId,
            username: userData.username,
            email: userData.email,
            role: userData.role
          };

          const expiredToken = createTokenWithExpiry(
            payload,
            -userData.expirySecondsAgo,
            env.JWT_SECRET
          );

          // Verify token is rejected
          expect(() => {
            jwtService.verifyAccessToken(expiredToken);
          }).toThrow(AuthenticationError);

          // Verify error message
          try {
            jwtService.verifyAccessToken(expiredToken);
            expect(true).toBe(false); // Should not reach here
          } catch (error) {
            expect(error).toBeInstanceOf(AuthenticationError);
            expect((error as AuthenticationError).message.toLowerCase()).toContain('expired');
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Tokens about to expire vs already expired
   * Test the boundary between valid and expired tokens
   */
  it('should distinguish between tokens about to expire and expired tokens', () => {
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.integer({ min: 1, max: 1000000 }),
          username: fc.string({ minLength: 5, maxLength: 40 })
            .filter(s => /^[a-zA-Z0-9_]+$/.test(s)),
          email: fc.emailAddress(),
          role: fc.constantFrom(...Object.values(UserRole))
        }),
        (userData) => {
          const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
            userId: userData.userId,
            username: userData.username,
            email: userData.email,
            role: userData.role
          };

          // Create token that expires in 5 seconds (still valid)
          const almostExpiredToken = createTokenWithExpiry(payload, 5, env.JWT_SECRET);

          // Create token that expired 1 second ago (invalid)
          const expiredToken = createTokenWithExpiry(payload, -1, env.JWT_SECRET);

          // Almost expired token should be accepted
          expect(() => {
            jwtService.verifyAccessToken(almostExpiredToken);
          }).not.toThrow();

          const verifiedPayload = jwtService.verifyAccessToken(almostExpiredToken);
          expect(verifiedPayload.userId).toBe(userData.userId);

          // Expired token should be rejected
          expect(() => {
            jwtService.verifyAccessToken(expiredToken);
          }).toThrow(AuthenticationError);
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property: Expired tokens cannot be used for token refresh
   * For any expired refresh token, the refresh operation should fail
   */
  it('should reject expired refresh tokens during token refresh', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.integer({ min: 1, max: 1000000 }),
          username: fc.string({ minLength: 5, maxLength: 40 })
            .filter(s => /^[a-zA-Z0-9_]+$/.test(s)),
          email: fc.emailAddress(),
          role: fc.constantFrom(...Object.values(UserRole))
        }),
        async (userData) => {
          // Create expired refresh token
          const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
            userId: userData.userId,
            username: userData.username,
            email: userData.email,
            role: userData.role
          };

          const expiredRefreshToken = createExpiredRefreshToken(payload);

          // Attempt to refresh tokens with expired refresh token should fail
          await expect(
            jwtService.refreshTokens(expiredRefreshToken)
          ).rejects.toThrow(AuthenticationError);

          // Verify error message
          try {
            await jwtService.refreshTokens(expiredRefreshToken);
            expect(true).toBe(false); // Should not reach here
          } catch (error) {
            expect(error).toBeInstanceOf(AuthenticationError);
            expect((error as AuthenticationError).message.toLowerCase()).toContain('expired');
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Token expiration is checked at verification time
   * A token that is valid when created but expires before verification should be rejected
   */
  it('should enforce expiration at verification time, not creation time', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.integer({ min: 1, max: 1000000 }),
          username: fc.string({ minLength: 5, maxLength: 40 })
            .filter(s => /^[a-zA-Z0-9_]+$/.test(s)),
          email: fc.emailAddress(),
          role: fc.constantFrom(...Object.values(UserRole))
        }),
        async (userData) => {
          const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
            userId: userData.userId,
            username: userData.username,
            email: userData.email,
            role: userData.role
          };

          // Create token that expires in 1 second
          const shortLivedToken = createTokenWithExpiry(payload, 1, env.JWT_SECRET);

          // Token should be valid immediately after creation
          expect(() => {
            jwtService.verifyAccessToken(shortLivedToken);
          }).not.toThrow();

          // Wait for token to expire (1.5 seconds to be safe)
          await new Promise(resolve => setTimeout(resolve, 1500));

          // Token should now be expired and rejected
          expect(() => {
            jwtService.verifyAccessToken(shortLivedToken);
          }).toThrow(AuthenticationError);

          // Verify error message indicates expiration
          try {
            jwtService.verifyAccessToken(shortLivedToken);
            expect(true).toBe(false); // Should not reach here
          } catch (error) {
            expect(error).toBeInstanceOf(AuthenticationError);
            expect((error as AuthenticationError).message.toLowerCase()).toContain('expired');
          }
        }
      ),
      { numRuns: 5 } // Fewer runs due to time delays
    );
  }, 30000); // 30 second timeout for this test

  /**
   * Property: All user roles are subject to token expiration
   * Token expiration should be enforced regardless of user role
   */
  it('should enforce token expiration for all user roles', () => {
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.integer({ min: 1, max: 1000000 }),
          username: fc.string({ minLength: 5, maxLength: 40 })
            .filter(s => /^[a-zA-Z0-9_]+$/.test(s)),
          email: fc.emailAddress(),
          role: fc.constantFrom(...Object.values(UserRole))
        }),
        (userData) => {
          // Create expired token for any role
          const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
            userId: userData.userId,
            username: userData.username,
            email: userData.email,
            role: userData.role
          };

          const expiredToken = createExpiredAccessToken(payload);

          // Expired token should be rejected regardless of role
          expect(() => {
            jwtService.verifyAccessToken(expiredToken);
          }).toThrow(AuthenticationError);

          // Verify error is consistent across all roles
          try {
            jwtService.verifyAccessToken(expiredToken);
            expect(true).toBe(false);
          } catch (error) {
            expect(error).toBeInstanceOf(AuthenticationError);
            expect((error as AuthenticationError).message.toLowerCase()).toContain('expired');
          }

          // Verify role doesn't grant immunity to expiration
          // Even admin tokens should expire
          if (userData.role === UserRole.SCHOOL_ADMIN) {
            expect(() => {
              jwtService.verifyAccessToken(expiredToken);
            }).toThrow(AuthenticationError);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Expired tokens with valid signatures are still rejected
   * Even if the signature is valid, expired tokens should be rejected
   */
  it('should reject expired tokens even with valid signatures', () => {
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.integer({ min: 1, max: 1000000 }),
          username: fc.string({ minLength: 5, maxLength: 40 })
            .filter(s => /^[a-zA-Z0-9_]+$/.test(s)),
          email: fc.emailAddress(),
          role: fc.constantFrom(...Object.values(UserRole))
        }),
        (userData) => {
          const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
            userId: userData.userId,
            username: userData.username,
            email: userData.email,
            role: userData.role
          };

          // Create expired token with valid signature (using correct secret)
          const expiredToken = createExpiredAccessToken(payload);

          // Decode token to verify it has valid structure and signature
          const decoded = jwt.decode(expiredToken) as any;
          expect(decoded).not.toBeNull();
          expect(decoded.userId).toBe(userData.userId);
          expect(decoded.role).toBe(userData.role);

          // Verify the signature is valid (but token is expired)
          // This should throw due to expiration, not invalid signature
          expect(() => {
            jwtService.verifyAccessToken(expiredToken);
          }).toThrow(AuthenticationError);

          // Verify the error is specifically about expiration
          try {
            jwtService.verifyAccessToken(expiredToken);
            expect(true).toBe(false);
          } catch (error) {
            expect(error).toBeInstanceOf(AuthenticationError);
            const errorMessage = (error as AuthenticationError).message.toLowerCase();
            expect(errorMessage).toContain('expired');
            // Should NOT contain "invalid" (which would indicate signature issue)
            expect(errorMessage).not.toContain('invalid');
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Expiration enforcement is consistent
   * Multiple verification attempts of the same expired token should all fail
   */
  it('should consistently reject expired tokens on multiple verification attempts', () => {
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.integer({ min: 1, max: 1000000 }),
          username: fc.string({ minLength: 5, maxLength: 40 })
            .filter(s => /^[a-zA-Z0-9_]+$/.test(s)),
          email: fc.emailAddress(),
          role: fc.constantFrom(...Object.values(UserRole)),
          verificationAttempts: fc.integer({ min: 2, max: 5 })
        }),
        (userData) => {
          const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
            userId: userData.userId,
            username: userData.username,
            email: userData.email,
            role: userData.role
          };

          const expiredToken = createExpiredAccessToken(payload);

          // Attempt to verify the same expired token multiple times
          for (let i = 0; i < userData.verificationAttempts; i++) {
            expect(() => {
              jwtService.verifyAccessToken(expiredToken);
            }).toThrow(AuthenticationError);

            // Verify error message is consistent
            try {
              jwtService.verifyAccessToken(expiredToken);
              expect(true).toBe(false);
            } catch (error) {
              expect(error).toBeInstanceOf(AuthenticationError);
              expect((error as AuthenticationError).message.toLowerCase()).toContain('expired');
            }
          }
        }
      ),
      { numRuns: 30 }
    );
  });
});
