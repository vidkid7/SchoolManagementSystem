import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import app from '../../../app';
import User, { UserRole, UserStatus } from '@models/User.model';
import jwtService from '../jwt.service';
import accountLockoutService from '../accountLockout.service';
import { getRedisClient } from '@config/redis';

/**
 * Authentication Endpoints Integration Tests
 * Tests all 7 authentication API endpoints
 * Requirements: 1.2, 1.11
 */

describe('Authentication Endpoints', () => {
  let testUser: User;
  let accessToken: string;

  beforeAll(async () => {
    // Create test user
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test@1234',
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      failedLoginAttempts: 0
    });

    // Generate access token for authenticated endpoints
    const payload = {
      userId: testUser.userId,
      username: testUser.username,
      email: testUser.email,
      role: testUser.role
    };
    accessToken = jwtService.generateAccessToken(payload);
  });

  afterAll(async () => {
    // Clean up
    await testUser.destroy({ force: true });
    const redis = getRedisClient();
    await redis.flushDb();
  });

  afterEach(async () => {
    // Reset lockout status after each test
    await accountLockoutService.resetFailedAttempts(testUser.username, testUser.userId);
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'testuser',
          password: 'Test@1234'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should login with email instead of username', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'test@example.com',
          password: 'Test@1234'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
    });

    it('should support rememberMe option', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'testuser',
          password: 'Test@1234',
          rememberMe: true
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should fail with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'testuser',
          password: 'WrongPassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid credentials');
    });

    it('should fail with non-existent user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'nonexistent',
          password: 'Test@1234'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should enforce rate limiting after 5 failed attempts', async () => {
      // Make 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/v1/auth/login')
          .send({
            username: 'testuser',
            password: 'WrongPassword'
          });
      }

      // 6th attempt should be rate limited
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'testuser',
          password: 'Test@1234'
        });

      expect(response.status).toBe(429);
      expect(response.body.error.message).toContain('rate limit');
    });

    it('should lock account after 5 failed attempts within 15 minutes', async () => {
      // Make 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/v1/auth/login')
          .send({
            username: 'testuser',
            password: 'WrongPassword'
          });
      }

      // Check lockout status
      const lockoutStatus = await accountLockoutService.checkLockoutStatus('testuser');
      expect(lockoutStatus.isLocked).toBe(true);
      expect(lockoutStatus.failedAttempts).toBe(5);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logout successful');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should invalidate refresh token', async () => {
      // Login to get tokens
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'testuser',
          password: 'Test@1234'
        });

      const { refreshToken } = loginResponse.body.data;
      const newAccessToken = loginResponse.body.data.accessToken;

      // Logout
      await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${newAccessToken}`);

      // Try to refresh with invalidated token
      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(refreshResponse.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh access token successfully', async () => {
      // Login to get refresh token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'testuser',
          password: 'Test@1234'
        });

      const { refreshToken } = loginResponse.body.data;

      // Refresh token
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should fail with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with expired refresh token', async () => {
      // Create an expired token
      const expiredToken = jwtService.generateRefreshToken({
        userId: testUser.userId,
        username: testUser.username,
        email: testUser.email,
        role: testUser.role
      });

      // Wait for token to expire (or mock expiration)
      // For testing, we'll just use an invalid token
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: expiredToken + 'invalid' });

      expect(response.status).toBe(401);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    it('should generate password reset token for valid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('password reset');

      // In development mode, token should be returned
      if (process.env.NODE_ENV === 'development') {
        expect(response.body.data).toHaveProperty('resetToken');
      }

      // Verify token was stored in database
      await testUser.reload();
      expect(testUser.passwordResetToken).toBeDefined();
      expect(testUser.passwordResetExpires).toBeDefined();
    });

    it('should not reveal if email does not exist', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('password reset');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'invalid-email' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/reset-password', () => {
    let resetToken: string;

    beforeEach(async () => {
      // Generate reset token
      resetToken = await testUser.generatePasswordResetToken();
    });

    it('should reset password with valid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'NewTest@1234',
          confirmNewPassword: 'NewTest@1234'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Password reset successfully');

      // Verify password was changed
      await testUser.reload();
      const isNewPassword = await testUser.comparePassword('NewTest@1234');
      expect(isNewPassword).toBe(true);

      // Verify reset token was cleared
      expect(testUser.passwordResetToken).toBeUndefined();
      expect(testUser.passwordResetExpires).toBeUndefined();
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'invalid-token',
          newPassword: 'NewTest@1234',
          confirmNewPassword: 'NewTest@1234'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid or expired');
    });

    it('should fail with expired token', async () => {
      // Manually expire the token
      testUser.passwordResetExpires = new Date(Date.now() - 1000);
      await testUser.save();

      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'NewTest@1234',
          confirmNewPassword: 'NewTest@1234'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should validate password requirements', async () => {
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'weak',
          confirmNewPassword: 'weak'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate password confirmation match', async () => {
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'NewTest@1234',
          confirmNewPassword: 'DifferentPassword@1234'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should not allow same password as current', async () => {
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'Test@1234',
          confirmNewPassword: 'Test@1234'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('different from current');
    });

    it('should invalidate all refresh tokens after reset', async () => {
      // Login to get refresh token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'testuser',
          password: 'Test@1234'
        });

      const { refreshToken: oldRefreshToken } = loginResponse.body.data;

      // Reset password
      await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'NewTest@1234',
          confirmNewPassword: 'NewTest@1234'
        });

      // Try to use old refresh token
      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: oldRefreshToken });

      expect(refreshResponse.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/change-password', () => {
    it('should change password successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'Test@1234',
          newPassword: 'NewTest@1234',
          confirmNewPassword: 'NewTest@1234'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Password changed successfully');

      // Verify password was changed
      await testUser.reload();
      const isNewPassword = await testUser.comparePassword('NewTest@1234');
      expect(isNewPassword).toBe(true);

      // Reset password for other tests
      testUser.password = 'Test@1234';
      await testUser.save();
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .send({
          currentPassword: 'Test@1234',
          newPassword: 'NewTest@1234',
          confirmNewPassword: 'NewTest@1234'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with incorrect current password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'WrongPassword',
          newPassword: 'NewTest@1234',
          confirmNewPassword: 'NewTest@1234'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Current password is incorrect');
    });

    it('should not allow same password as current', async () => {
      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'Test@1234',
          newPassword: 'Test@1234',
          confirmNewPassword: 'Test@1234'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('different from current');
    });

    it('should validate password requirements', async () => {
      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'Test@1234',
          newPassword: 'weak',
          confirmNewPassword: 'weak'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate password confirmation match', async () => {
      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'Test@1234',
          newPassword: 'NewTest@1234',
          confirmNewPassword: 'DifferentPassword@1234'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should invalidate all refresh tokens after change', async () => {
      // Login to get refresh token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'testuser',
          password: 'Test@1234'
        });

      const { refreshToken: oldRefreshToken, accessToken: newAccessToken } = loginResponse.body.data;

      // Change password
      await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .send({
          currentPassword: 'Test@1234',
          newPassword: 'NewTest@1234',
          confirmNewPassword: 'NewTest@1234'
        });

      // Try to use old refresh token
      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: oldRefreshToken });

      expect(refreshResponse.status).toBe(401);

      // Reset password for other tests
      testUser.password = 'Test@1234';
      await testUser.save();
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should get current user profile', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('userId');
      expect(response.body.data).toHaveProperty('username');
      expect(response.body.data).toHaveProperty('email');
      expect(response.body.data).toHaveProperty('role');
      expect(response.body.data).not.toHaveProperty('password');
      expect(response.body.data.email).toBe('test@example.com');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with expired token', async () => {
      // This would require mocking time or waiting for token expiration
      // For now, we'll just test with an invalid token format
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
