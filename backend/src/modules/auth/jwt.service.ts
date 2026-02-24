import jwt from 'jsonwebtoken';
import { getRedisClient } from '@config/redis';
import { env } from '@config/env';
import { logger } from '@utils/logger';
import { AuthenticationError } from '@middleware/errorHandler';
import { UserRole } from '@models/User.model';

/**
 * JWT Payload Interface
 * Contains user information and role/permissions
 * Requirements: 1.2
 */
export interface JWTPayload {
  userId: number;
  username: string;
  email: string;
  role: UserRole;
  permissions?: string[];
  iat?: number;
  exp?: number;
}

/**
 * Token Pair Interface
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * JWT Service
 * Handles JWT token generation, verification, and refresh token management
 * Requirements: 1.2, 1.3
 */
class JWTService {
  private readonly ACCESS_TOKEN_EXPIRY = '7d'; // 7 days (for development)
  private readonly REFRESH_TOKEN_EXPIRY = '30d'; // 30 days
  private readonly REFRESH_TOKEN_EXPIRY_SECONDS = 30 * 24 * 60 * 60; // 30 days in seconds
  private readonly EXTENDED_REFRESH_TOKEN_EXPIRY = '90d'; // 90 days for "Remember Me"
  private readonly EXTENDED_REFRESH_TOKEN_EXPIRY_SECONDS = 90 * 24 * 60 * 60; // 90 days in seconds

  /**
   * Generate JWT access token with 30 minute expiry
   * Token contains role and permissions in payload
   * Requirements: 1.2
   * 
   * @param payload - User data to encode in token
   * @returns JWT access token
   */
  generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    try {
      const token = jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: this.ACCESS_TOKEN_EXPIRY
      });

      logger.debug('Access token generated', {
        userId: payload.userId,
        role: payload.role,
        expiresIn: this.ACCESS_TOKEN_EXPIRY
      });

      return token;
    } catch (error) {
      logger.error('Error generating access token', { error, userId: payload.userId });
      throw new Error('Failed to generate access token');
    }
  }

  /**
   * Generate JWT refresh token with 7 days expiry
   * Token is stored in Redis with automatic expiration
   * Requirements: 1.3
   * 
   * @param payload - User data to encode in token
   * @param rememberMe - If true, extends expiry to 30 days
   * @returns JWT refresh token
   */
  generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>, rememberMe = false): string {
    try {
      const expiresIn = rememberMe ? this.EXTENDED_REFRESH_TOKEN_EXPIRY : this.REFRESH_TOKEN_EXPIRY;
      
      const token = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
        expiresIn
      });

      logger.debug('Refresh token generated', {
        userId: payload.userId,
        rememberMe,
        expiresIn
      });

      return token;
    } catch (error) {
      logger.error('Error generating refresh token', { error, userId: payload.userId });
      throw new Error('Failed to generate refresh token');
    }
  }

  /**
   * Generate both access and refresh tokens
   * Stores refresh token in Redis with automatic expiration
   * Requirements: 1.2, 1.3
   * 
   * @param payload - User data to encode in tokens
   * @param rememberMe - If true, extends refresh token expiry to 30 days
   * @returns Token pair (access and refresh tokens)
   */
  async generateTokenPair(
    payload: Omit<JWTPayload, 'iat' | 'exp'>,
    rememberMe = false
  ): Promise<TokenPair> {
    try {
      const accessToken = this.generateAccessToken(payload);
      const refreshToken = this.generateRefreshToken(payload, rememberMe);

      // Store refresh token in Redis with automatic expiration
      await this.storeRefreshToken(payload.userId, refreshToken, rememberMe);

      logger.info('Token pair generated and stored', {
        userId: payload.userId,
        rememberMe
      });

      return { accessToken, refreshToken };
    } catch (error) {
      logger.error('Error generating token pair', { error, userId: payload.userId });
      throw error;
    }
  }

  /**
   * Store refresh token in Redis with automatic expiration
   * Requirements: 1.3
   * 
   * @param userId - User ID
   * @param refreshToken - Refresh token to store
   * @param rememberMe - If true, uses extended expiry (30 days)
   */
  async storeRefreshToken(userId: number, refreshToken: string, rememberMe = false): Promise<void> {
    try {
      const redis = getRedisClient();
      if (!redis) {
        logger.warn('Redis not available, refresh token not stored (will rely on JWT expiry only)');
        return;
      }

      const key = this.getRefreshTokenKey(userId);
      const expirySeconds = rememberMe 
        ? this.EXTENDED_REFRESH_TOKEN_EXPIRY_SECONDS 
        : this.REFRESH_TOKEN_EXPIRY_SECONDS;

      // Store token with automatic expiration
      await redis.setEx(key, expirySeconds, refreshToken);

      logger.debug('Refresh token stored in Redis', {
        userId,
        expirySeconds,
        rememberMe
      });
    } catch (error) {
      logger.error('Error storing refresh token in Redis', { error, userId });
      // Don't throw - app can work without Redis
      logger.warn('Continuing without Redis token storage');
    }
  }

  /**
   * Verify JWT access token with signature validation
   * Requirements: 1.3
   * 
   * @param token - JWT access token
   * @returns Decoded payload
   * @throws AuthenticationError if token is invalid or expired
   */
  verifyAccessToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;

      logger.debug('Access token verified', {
        userId: decoded.userId,
        role: decoded.role
      });

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.debug('Access token expired');
        throw new AuthenticationError('Access token expired');
      }
      
      if (error instanceof jwt.JsonWebTokenError) {
        logger.warn('Invalid access token', { error: error.message });
        throw new AuthenticationError('Invalid access token');
      }

      logger.error('Error verifying access token', { error });
      throw new AuthenticationError('Token verification failed');
    }
  }

  /**
   * Verify JWT refresh token with signature validation
   * Requirements: 1.3
   * 
   * @param token - JWT refresh token
   * @returns Decoded payload
   * @throws AuthenticationError if token is invalid or expired
   */
  verifyRefreshToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as JWTPayload;

      logger.debug('Refresh token verified', {
        userId: decoded.userId
      });

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.debug('Refresh token expired');
        throw new AuthenticationError('Refresh token expired');
      }
      
      if (error instanceof jwt.JsonWebTokenError) {
        logger.warn('Invalid refresh token', { error: error.message });
        throw new AuthenticationError('Invalid refresh token');
      }

      logger.error('Error verifying refresh token', { error });
      throw new AuthenticationError('Token verification failed');
    }
  }

  /**
   * Retrieve refresh token from Redis
   * Requirements: 1.3
   * 
   * @param userId - User ID
   * @returns Refresh token or null if not found
   */
  async getRefreshToken(userId: number): Promise<string | null> {
    try {
      const redis = getRedisClient();
      if (!redis) {
        logger.debug('Redis not available, cannot retrieve refresh token');
        return null;
      }

      const key = this.getRefreshTokenKey(userId);
      const token = await redis.get(key);

      logger.debug('Refresh token retrieved from Redis', {
        userId,
        found: !!token
      });

      return token;
    } catch (error) {
      logger.error('Error retrieving refresh token from Redis', { error, userId });
      return null;
    }
  }

  /**
   * Implement token refresh logic using refresh tokens
   * Validates refresh token and generates new token pair
   * Requirements: 1.3
   * 
   * @param refreshToken - Valid refresh token
   * @returns New token pair
   * @throws AuthenticationError if refresh token is invalid or not found in Redis
   */
  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    try {
      // Verify refresh token signature
      const decoded = this.verifyRefreshToken(refreshToken);

      // Retrieve stored refresh token from Redis
      const storedToken = await this.getRefreshToken(decoded.userId);

      // Validate that the provided token matches the stored token
      if (!storedToken || storedToken !== refreshToken) {
        logger.warn('Refresh token mismatch or not found', {
          userId: decoded.userId,
          hasStoredToken: !!storedToken
        });
        throw new AuthenticationError('Invalid refresh token');
      }

      // Generate new token pair
      const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
        userId: decoded.userId,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role,
        permissions: decoded.permissions
      };

      const newTokenPair = await this.generateTokenPair(payload);

      logger.info('Tokens refreshed successfully', {
        userId: decoded.userId
      });

      return newTokenPair;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      logger.error('Error refreshing tokens', { error });
      throw new AuthenticationError('Failed to refresh tokens');
    }
  }

  /**
   * Invalidate refresh token by removing it from Redis
   * Used during logout
   * Requirements: 1.3
   * 
   * @param userId - User ID
   */
  async invalidateRefreshToken(userId: number): Promise<void> {
    try {
      const redis = getRedisClient();
      if (!redis) {
        logger.debug('Redis not available, cannot invalidate refresh token');
        return;
      }

      const key = this.getRefreshTokenKey(userId);
      await redis.del(key);

      logger.info('Refresh token invalidated', { userId });
    } catch (error) {
      logger.error('Error invalidating refresh token', { error, userId });
      // Don't throw - app can work without Redis
    }
  }

  /**
   * Invalidate all refresh tokens for a user
   * Used when user changes password or role
   * 
   * @param userId - User ID
   */
  async invalidateAllUserTokens(userId: number): Promise<void> {
    try {
      await this.invalidateRefreshToken(userId);
      
      logger.info('All user tokens invalidated', { userId });
    } catch (error) {
      logger.error('Error invalidating all user tokens', { error, userId });
      throw error;
    }
  }

  /**
   * Get Redis key for refresh token
   * 
   * @param userId - User ID
   * @returns Redis key
   */
  private getRefreshTokenKey(userId: number): string {
    return `refresh_token:${userId}`;
  }

  /**
   * Check if Redis is available
   * 
   * @returns True if Redis is available
   */
  async isRedisAvailable(): Promise<boolean> {
    try {
      const redis = getRedisClient();
      if (!redis) {
        return false;
      }
      await redis.ping();
      return true;
    } catch (error) {
      logger.warn('Redis is not available', { error });
      return false;
    }
  }
}

export default new JWTService();
