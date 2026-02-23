import jwtService, { JWTPayload } from '../jwt.service';
import { getRedisClient } from '@config/redis';
import { UserRole } from '@models/User.model';
import jwt from 'jsonwebtoken';
import { env } from '@config/env';

// Mock Redis client
jest.mock('@config/redis');

describe('JWT Service', () => {
  let mockRedisClient: any;

  beforeEach(() => {
    // Setup mock Redis client
    mockRedisClient = {
      setEx: jest.fn().mockResolvedValue('OK'),
      get: jest.fn(),
      del: jest.fn().mockResolvedValue(1),
      ping: jest.fn().mockResolvedValue('PONG')
    };

    (getRedisClient as jest.Mock).mockReturnValue(mockRedisClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAccessToken', () => {
    it('should generate a valid access token with 30 minute expiry', () => {
      const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: UserRole.STUDENT
      };

      const token = jwtService.generateAccessToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Verify token contains correct payload
      const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.username).toBe(payload.username);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);

      // Verify expiry is approximately 30 minutes (1800 seconds)
      const expiryTime = decoded.exp! - decoded.iat!;
      expect(expiryTime).toBeGreaterThanOrEqual(1799);
      expect(expiryTime).toBeLessThanOrEqual(1801);
    });

    it('should include role and permissions in token payload', () => {
      const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
        userId: 1,
        username: 'admin',
        email: 'admin@example.com',
        role: UserRole.SCHOOL_ADMIN,
        permissions: ['read:all', 'write:all', 'delete:all']
      };

      const token = jwtService.generateAccessToken(payload);
      const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;

      expect(decoded.role).toBe(UserRole.SCHOOL_ADMIN);
      expect(decoded.permissions).toEqual(['read:all', 'write:all', 'delete:all']);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token with 7 day expiry by default', () => {
      const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: UserRole.STUDENT
      };

      const token = jwtService.generateRefreshToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Verify token contains correct payload
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as JWTPayload;
      expect(decoded.userId).toBe(payload.userId);

      // Verify expiry is approximately 7 days (604800 seconds)
      const expiryTime = decoded.exp! - decoded.iat!;
      expect(expiryTime).toBeGreaterThanOrEqual(604799);
      expect(expiryTime).toBeLessThanOrEqual(604801);
    });

    it('should generate refresh token with 30 day expiry when rememberMe is true', () => {
      const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: UserRole.STUDENT
      };

      const token = jwtService.generateRefreshToken(payload, true);
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as JWTPayload;

      // Verify expiry is approximately 30 days (2592000 seconds)
      const expiryTime = decoded.exp! - decoded.iat!;
      expect(expiryTime).toBeGreaterThanOrEqual(2591999);
      expect(expiryTime).toBeLessThanOrEqual(2592001);
    });
  });

  describe('storeRefreshToken', () => {
    it('should store refresh token in Redis with 7 day expiry', async () => {
      const userId = 1;
      const refreshToken = 'test-refresh-token';

      await jwtService.storeRefreshToken(userId, refreshToken, false);

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'refresh_token:1',
        7 * 24 * 60 * 60, // 7 days in seconds
        refreshToken
      );
    });

    it('should store refresh token in Redis with 30 day expiry when rememberMe is true', async () => {
      const userId = 1;
      const refreshToken = 'test-refresh-token';

      await jwtService.storeRefreshToken(userId, refreshToken, true);

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'refresh_token:1',
        30 * 24 * 60 * 60, // 30 days in seconds
        refreshToken
      );
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens and store refresh token in Redis', async () => {
      const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: UserRole.STUDENT
      };

      const tokens = await jwtService.generateTokenPair(payload);

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'refresh_token:1',
        7 * 24 * 60 * 60,
        tokens.refreshToken
      );
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid access token and return payload', () => {
      const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: UserRole.STUDENT
      };

      const token = jwtService.generateAccessToken(payload);
      const decoded = jwtService.verifyAccessToken(token);

      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.username).toBe(payload.username);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    it('should throw AuthenticationError for expired token', () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { userId: 1, username: 'test', email: 'test@example.com', role: UserRole.STUDENT },
        env.JWT_SECRET,
        { expiresIn: '0s' }
      );

      // Wait a bit to ensure token is expired
      return new Promise((resolve) => {
        setTimeout(() => {
          expect(() => jwtService.verifyAccessToken(expiredToken)).toThrow('Access token expired');
          resolve(undefined);
        }, 100);
      });
    });

    it('should throw AuthenticationError for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => jwtService.verifyAccessToken(invalidToken)).toThrow('Invalid access token');
    });

    it('should throw AuthenticationError for token with wrong signature', () => {
      const wrongToken = jwt.sign(
        { userId: 1, username: 'test', email: 'test@example.com', role: UserRole.STUDENT },
        'wrong-secret',
        { expiresIn: '30m' }
      );

      expect(() => jwtService.verifyAccessToken(wrongToken)).toThrow('Invalid access token');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token and return payload', () => {
      const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: UserRole.STUDENT
      };

      const token = jwtService.generateRefreshToken(payload);
      const decoded = jwtService.verifyRefreshToken(token);

      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.username).toBe(payload.username);
    });

    it('should throw AuthenticationError for expired refresh token', () => {
      const expiredToken = jwt.sign(
        { userId: 1, username: 'test', email: 'test@example.com', role: UserRole.STUDENT },
        env.JWT_REFRESH_SECRET,
        { expiresIn: '0s' }
      );

      return new Promise((resolve) => {
        setTimeout(() => {
          expect(() => jwtService.verifyRefreshToken(expiredToken)).toThrow('Refresh token expired');
          resolve(undefined);
        }, 100);
      });
    });
  });

  describe('getRefreshToken', () => {
    it('should retrieve refresh token from Redis', async () => {
      const userId = 1;
      const expectedToken = 'stored-refresh-token';
      mockRedisClient.get.mockResolvedValue(expectedToken);

      const token = await jwtService.getRefreshToken(userId);

      expect(token).toBe(expectedToken);
      expect(mockRedisClient.get).toHaveBeenCalledWith('refresh_token:1');
    });

    it('should return null if refresh token not found in Redis', async () => {
      const userId = 1;
      mockRedisClient.get.mockResolvedValue(null);

      const token = await jwtService.getRefreshToken(userId);

      expect(token).toBeNull();
    });
  });

  describe('refreshTokens', () => {
    it('should generate new token pair when refresh token is valid and matches stored token', async () => {
      const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: UserRole.STUDENT
      };

      const originalRefreshToken = jwtService.generateRefreshToken(payload);
      mockRedisClient.get.mockResolvedValue(originalRefreshToken);

      // Wait a bit to ensure new tokens have different timestamps
      await new Promise(resolve => setTimeout(resolve, 1100));

      const newTokens = await jwtService.refreshTokens(originalRefreshToken);

      expect(newTokens.accessToken).toBeDefined();
      expect(newTokens.refreshToken).toBeDefined();
      // Tokens generated at different times should be different
      expect(newTokens.refreshToken).not.toBe(originalRefreshToken);
      expect(mockRedisClient.setEx).toHaveBeenCalled();
    });

    it('should throw AuthenticationError when refresh token not found in Redis', async () => {
      const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: UserRole.STUDENT
      };

      const refreshToken = jwtService.generateRefreshToken(payload);
      mockRedisClient.get.mockResolvedValue(null);

      await expect(jwtService.refreshTokens(refreshToken)).rejects.toThrow('Invalid refresh token');
    });

    it('should throw AuthenticationError when refresh token does not match stored token', async () => {
      const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: UserRole.STUDENT
      };

      const refreshToken = jwtService.generateRefreshToken(payload);
      
      // Wait to ensure different token
      await new Promise(resolve => setTimeout(resolve, 1100));
      const differentToken = jwtService.generateRefreshToken(payload);
      
      mockRedisClient.get.mockResolvedValue(differentToken);

      await expect(jwtService.refreshTokens(refreshToken)).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('invalidateRefreshToken', () => {
    it('should delete refresh token from Redis', async () => {
      const userId = 1;

      await jwtService.invalidateRefreshToken(userId);

      expect(mockRedisClient.del).toHaveBeenCalledWith('refresh_token:1');
    });
  });

  describe('invalidateAllUserTokens', () => {
    it('should invalidate all tokens for a user', async () => {
      const userId = 1;

      await jwtService.invalidateAllUserTokens(userId);

      expect(mockRedisClient.del).toHaveBeenCalledWith('refresh_token:1');
    });
  });

  describe('isRedisAvailable', () => {
    it('should return true when Redis is available', async () => {
      mockRedisClient.ping.mockResolvedValue('PONG');

      const isAvailable = await jwtService.isRedisAvailable();

      expect(isAvailable).toBe(true);
      expect(mockRedisClient.ping).toHaveBeenCalled();
    });

    it('should return false when Redis is not available', async () => {
      mockRedisClient.ping.mockRejectedValue(new Error('Connection failed'));

      const isAvailable = await jwtService.isRedisAvailable();

      expect(isAvailable).toBe(false);
    });
  });
});
