import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { RATE_LIMITS } from '@config/constants';
import { logger } from '@utils/logger';
import { RateLimitError } from './errorHandler';
import { Request, Response } from 'express';
import { getRedisClient } from '@config/redis';

/**
 * Rate Limiting Middleware
 * Implements rate limiting to prevent abuse with Redis storage
 * Requirements: 35.4, 36.7
 */

/**
 * Get Redis store for rate limiting
 * Falls back to memory store if Redis is unavailable
 */
const getRedisStore = (): RedisStore | undefined => {
  try {
    const redisClient = getRedisClient();
    return new RedisStore({
      sendCommand: (...args: string[]) => redisClient.sendCommand(args),
      prefix: 'rl:' // Rate limit prefix for Redis keys
    });
  } catch (error) {
    logger.warn('Redis not available for rate limiting, using memory store', { error });
    return undefined; // Falls back to default memory store
  }
};

/**
 * General API Rate Limiter
 * 100 requests per minute per user
 * Uses Redis for distributed rate limiting
 * Requirements: 35.4
 */
export const apiRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.API.WINDOW_MS,
  max: RATE_LIMITS.API.MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  store: getRedisStore(),
  handler: (_req: Request, _res: Response) => {
    logger.warn('API rate limit exceeded', {
      ip: _req.ip,
      path: _req.path,
      method: _req.method,
      userId: _req.user?.userId
    });

    throw new RateLimitError('Too many requests. Please try again later.');
  },
  keyGenerator: (req: Request) => {
    // Use user ID if authenticated, otherwise use IP
    return req.user?.userId.toString() || req.ip || 'unknown';
  },
  skip: (req: Request) => {
    // Skip rate limiting for health check endpoint
    return req.path === '/health';
  }
});

/**
 * Strict Login Rate Limiter
 * 5 attempts per 15 minutes per IP
 * Uses Redis for distributed rate limiting
 * Requirements: 1.9, 35.4
 */
export const loginRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.LOGIN.WINDOW_MS,
  max: RATE_LIMITS.LOGIN.MAX_REQUESTS,
  message: 'Too many login attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  store: getRedisStore(),
  skipSuccessfulRequests: true, // Don't count successful logins
  handler: (req: Request, _res: Response) => {
    logger.warn('Login rate limit exceeded', {
      ip: req.ip,
      username: req.body?.username
    });

    throw new RateLimitError(
      'Too many login attempts. Please try again after 15 minutes.'
    );
  },
  keyGenerator: (req: Request) => {
    // Use IP address for login attempts
    return req.ip || 'unknown';
  }
});

/**
 * File Upload Rate Limiter
 * 10 uploads per minute per user
 * Uses Redis for distributed rate limiting
 * Requirements: 35.4
 */
export const fileUploadRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.FILE_UPLOAD.WINDOW_MS,
  max: RATE_LIMITS.FILE_UPLOAD.MAX_REQUESTS,
  message: 'Too many file uploads, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  store: getRedisStore(),
  handler: (req: Request, _res: Response) => {
    logger.warn('File upload rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.userId,
      path: req.path
    });

    throw new RateLimitError('Too many file uploads. Please try again later.');
  },
  keyGenerator: (req: Request) => {
    return req.user?.userId.toString() || req.ip || 'unknown';
  }
});

/**
 * Custom Rate Limiter Factory
 * Creates a rate limiter with custom configuration
 * Uses Redis for distributed rate limiting
 * 
 * @param options - Rate limiter options
 * @returns Rate limiter middleware
 */
export const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}): RateLimitRequestHandler => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    store: getRedisStore(),
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    handler: (req: Request, _res: Response) => {
      logger.warn('Custom rate limit exceeded', {
        ip: req.ip,
        userId: req.user?.userId,
        path: req.path,
        method: req.method
      });

      throw new RateLimitError(
        options.message || 'Too many requests. Please try again later.'
      );
    },
    keyGenerator: (req: Request) => {
      return req.user?.userId.toString() || req.ip || 'unknown';
    }
  });
};

export default {
  apiRateLimiter,
  loginRateLimiter,
  fileUploadRateLimiter,
  createRateLimiter
};
