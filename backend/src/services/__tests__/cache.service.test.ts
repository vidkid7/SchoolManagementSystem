import { CacheService } from '../cache.service';

const mockRedisClient = {
  get: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
  scan: jest.fn(),
  flushDb: jest.fn(),
  info: jest.fn(),
};

jest.mock('@config/redis', () => ({
  getRedisClient: () => mockRedisClient,
}));

jest.mock('@utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(() => {
    service = new CacheService(300);
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should return parsed data when cache hit', async () => {
      const data = { id: 1, name: 'Test' };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(data));

      const result = await service.get<typeof data>('test:key');
      expect(result).toEqual(data);
      expect(mockRedisClient.get).toHaveBeenCalledWith('test:key');
    });

    it('should return null on cache miss', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await service.get('test:miss');
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('connection lost'));

      const result = await service.get('test:error');
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should store serialized data with TTL', async () => {
      mockRedisClient.setEx.mockResolvedValue('OK');

      await service.set('test:key', { id: 1 }, 600);
      expect(mockRedisClient.setEx).toHaveBeenCalledWith('test:key', 600, '{"id":1}');
    });

    it('should use default TTL when not specified', async () => {
      mockRedisClient.setEx.mockResolvedValue('OK');

      await service.set('test:key', 'value');
      expect(mockRedisClient.setEx).toHaveBeenCalledWith('test:key', 300, '"value"');
    });
  });

  describe('del', () => {
    it('should delete a cache key', async () => {
      mockRedisClient.del.mockResolvedValue(1);

      await service.del('test:key');
      expect(mockRedisClient.del).toHaveBeenCalledWith('test:key');
    });
  });

  describe('invalidatePattern', () => {
    it('should scan and delete matching keys', async () => {
      mockRedisClient.scan
        .mockResolvedValueOnce({ cursor: 5, keys: ['k1', 'k2'] })
        .mockResolvedValueOnce({ cursor: 0, keys: ['k3'] });
      mockRedisClient.del.mockResolvedValue(1);

      const deleted = await service.invalidatePattern('test:*');
      expect(deleted).toBe(3);
      expect(mockRedisClient.del).toHaveBeenCalledTimes(2);
    });

    it('should return 0 when no keys match', async () => {
      mockRedisClient.scan.mockResolvedValueOnce({ cursor: 0, keys: [] });

      const deleted = await service.invalidatePattern('none:*');
      expect(deleted).toBe(0);
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if available', async () => {
      mockRedisClient.get.mockResolvedValue(JSON.stringify({ cached: true }));

      const factory = jest.fn().mockResolvedValue({ cached: false });
      const result = await service.getOrSet('test:key', factory);

      expect(result).toEqual({ cached: true });
      expect(factory).not.toHaveBeenCalled();
    });

    it('should call factory and cache when miss', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.setEx.mockResolvedValue('OK');

      const factory = jest.fn().mockResolvedValue({ fresh: true });
      const result = await service.getOrSet('test:key', factory, 600);

      expect(result).toEqual({ fresh: true });
      expect(factory).toHaveBeenCalledTimes(1);
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'test:key',
        600,
        '{"fresh":true}'
      );
    });
  });

  describe('flush', () => {
    it('should flush the database', async () => {
      mockRedisClient.flushDb.mockResolvedValue('OK');

      await service.flush();
      expect(mockRedisClient.flushDb).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should parse Redis info stats', async () => {
      mockRedisClient.info
        .mockResolvedValueOnce('keyspace_hits:100\nkeyspace_misses:20\n')
        .mockResolvedValueOnce('db0:keys=50,expires=10\n');

      const stats = await service.getStats();
      expect(stats).toEqual({ hits: 100, misses: 20, keys: 50 });
    });

    it('should return null on error', async () => {
      mockRedisClient.info.mockRejectedValue(new Error('fail'));

      const stats = await service.getStats();
      expect(stats).toBeNull();
    });
  });
});
