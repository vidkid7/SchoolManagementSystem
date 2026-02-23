import { Request, Response, NextFunction } from 'express';
import { cacheService } from '@services/cache.service';
import { logger } from '@utils/logger';
import crypto from 'crypto';

interface CacheOptions {
  ttl?: number;
  keyPrefix?: string;
  condition?: (req: Request) => boolean;
}

function buildCacheKey(prefix: string, req: Request): string {
  const parts = [
    prefix,
    req.originalUrl,
    JSON.stringify(req.query),
  ];
  const hash = crypto.createHash('md5').update(parts.join('|')).digest('hex');
  return `http:${prefix}:${hash}`;
}

export function cacheResponse(options: CacheOptions = {}) {
  const { ttl = 300, keyPrefix = 'api', condition } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.method !== 'GET') {
      next();
      return;
    }

    if (condition && !condition(req)) {
      next();
      return;
    }

    const key = buildCacheKey(keyPrefix, req);

    try {
      const cached = await cacheService.get<{ status: number; body: any }>(key);
      if (cached) {
        res.status(cached.status).json(cached.body);
        return;
      }
    } catch {
      // Cache miss or error, continue to handler
    }

    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheService.set(key, { status: res.statusCode, body }, ttl).catch((err) => {
          logger.warn('Failed to cache response', { key, error: err });
        });
      }
      return originalJson(body);
    };

    next();
  };
}

export function invalidateCache(patterns: string[]) {
  return async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      for (const pattern of patterns) {
        await cacheService.invalidatePattern(pattern);
      }
    } catch (error) {
      logger.warn('Cache invalidation failed', { patterns, error });
    }
    next();
  };
}
