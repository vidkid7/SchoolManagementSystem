import { createClient, RedisClientType } from 'redis';
import { logger } from '@utils/logger';

/**
 * Redis Configuration
 * Used for session management and caching
 */

let redisClient: RedisClientType | null = null;

export const connectRedis = async (): Promise<RedisClientType | null> => {
  if (redisClient) {
    return redisClient;
  }

  // Skip Redis if not configured
  if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
    logger.info('ℹ️  Redis not configured, skipping...');
    return null;
  }

  try {
    const redisConfig = process.env.REDIS_URL 
      ? { url: process.env.REDIS_URL }
      : {
          socket: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379')
          },
          password: process.env.REDIS_PASSWORD || undefined,
          database: 0
        };

    redisClient = createClient(redisConfig);

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('✅ Redis connected successfully');
    });

    redisClient.on('reconnecting', () => {
      logger.warn('Redis reconnecting...');
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
    });

    await redisClient.connect();
    
    return redisClient;
  } catch (error) {
    logger.error('❌ Failed to connect to Redis:', error);
    throw error;
  }
};

export const getRedisClient = (): RedisClientType | null => {
  return redisClient;
};

export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis connection closed');
  }
};

export default { connectRedis, getRedisClient, closeRedis };
