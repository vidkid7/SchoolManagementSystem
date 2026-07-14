const mockRateLimit = jest.fn(() => jest.fn());
const mockRedisStore = jest.fn((_options: {
  sendCommand: (...args: string[]) => Promise<unknown>;
}) => ({}));
const mockGetRedisClient = jest.fn();

jest.mock('express-rate-limit', () => ({
  __esModule: true,
  default: mockRateLimit,
}));

jest.mock('rate-limit-redis', () => ({
  __esModule: true,
  default: mockRedisStore,
}));

jest.mock('@config/redis', () => ({
  getRedisClient: mockGetRedisClient,
}));

describe('Redis-backed rate limiters', () => {
  const originalRedisUrl = process.env.REDIS_URL;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env.REDIS_URL = 'redis://redis.railway.internal:6379';
    mockGetRedisClient.mockReturnValue(null);
  });

  afterAll(() => {
    if (originalRedisUrl === undefined) {
      delete process.env.REDIS_URL;
    } else {
      process.env.REDIS_URL = originalRedisUrl;
    }
  });

  it('defers client lookup when Redis is configured before the client connects', async () => {
    jest.isolateModules(() => {
      require('../rateLimiter');
    });

    expect(mockRedisStore).toHaveBeenCalledTimes(3);

    const sendCommand = mockRedisStore.mock.calls[0][0].sendCommand;
    const clientCommand = jest.fn().mockResolvedValue('PONG');
    mockGetRedisClient.mockReturnValue({ sendCommand: clientCommand });

    await expect(sendCommand('PING')).resolves.toBe('PONG');
    expect(clientCommand).toHaveBeenCalledWith(['PING']);
  });
});