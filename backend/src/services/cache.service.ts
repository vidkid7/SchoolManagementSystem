import { getRedisClient } from '@config/redis';
import { logger } from '@utils/logger';

export class CacheService {
  private defaultTTL: number;

  constructor(defaultTTL = 300) {
    this.defaultTTL = defaultTTL;
  }

  private getClient() {
    try {
      return getRedisClient();
    } catch {
      return null;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const client = this.getClient();
    if (!client) return null;

    try {
      const data = await client.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      logger.warn('Cache get error', { key, error });
      return null;
    }
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    const client = this.getClient();
    if (!client) return;

    try {
      const serialized = JSON.stringify(value);
      await client.setEx(key, ttl ?? this.defaultTTL, serialized);
    } catch (error) {
      logger.warn('Cache set error', { key, error });
    }
  }

  async del(key: string): Promise<void> {
    const client = this.getClient();
    if (!client) return;

    try {
      await client.del(key);
    } catch (error) {
      logger.warn('Cache del error', { key, error });
    }
  }

  async invalidatePattern(pattern: string): Promise<number> {
    const client = this.getClient();
    if (!client) return 0;

    try {
      let cursor = 0;
      let deleted = 0;

      do {
        const result = await client.scan(cursor, { MATCH: pattern, COUNT: 100 });
        cursor = result.cursor;

        if (result.keys.length > 0) {
          await client.del(result.keys);
          deleted += result.keys.length;
        }
      } while (cursor !== 0);

      logger.debug('Cache invalidated', { pattern, deleted });
      return deleted;
    } catch (error) {
      logger.warn('Cache invalidatePattern error', { pattern, error });
      return 0;
    }
  }

  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  async flush(): Promise<void> {
    const client = this.getClient();
    if (!client) return;

    try {
      await client.flushDb();
      logger.info('Cache flushed');
    } catch (error) {
      logger.warn('Cache flush error', { error });
    }
  }

  async getStats(): Promise<{ hits: number; misses: number; keys: number } | null> {
    const client = this.getClient();
    if (!client) return null;

    try {
      const info = await client.info('stats');
      const keyspace = await client.info('keyspace');

      const hitsMatch = info.match(/keyspace_hits:(\d+)/);
      const missesMatch = info.match(/keyspace_misses:(\d+)/);
      const keysMatch = keyspace.match(/keys=(\d+)/);

      return {
        hits: hitsMatch ? parseInt(hitsMatch[1], 10) : 0,
        misses: missesMatch ? parseInt(missesMatch[1], 10) : 0,
        keys: keysMatch ? parseInt(keysMatch[1], 10) : 0,
      };
    } catch (error) {
      logger.warn('Cache getStats error', { error });
      return null;
    }
  }
}

export const cacheService = new CacheService();

export const CACHE_KEYS = {
  STUDENT: (id: number) => `student:${id}`,
  STUDENT_LIST: (query: string) => `students:list:${query}`,
  STAFF: (id: number) => `staff:${id}`,
  STAFF_LIST: (query: string) => `staff:list:${query}`,
  CLASS: (id: number) => `class:${id}`,
  CLASS_LIST: () => 'classes:list',
  SUBJECT_LIST: () => 'subjects:list',
  ACADEMIC_YEAR: () => 'academic:current_year',
  FEE_STRUCTURE: (classId: number) => `fee:structure:${classId}`,
  TIMETABLE: (classId: number) => `timetable:${classId}`,
  DASHBOARD_STATS: (role: string) => `dashboard:stats:${role}`,
  REPORT: (type: string, params: string) => `report:${type}:${params}`,
};

export const CACHE_TTL = {
  SHORT: 60,
  MEDIUM: 300,
  LONG: 900,
  HOUR: 3600,
  DAY: 86400,
};

export default cacheService;
