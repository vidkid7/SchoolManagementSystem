import axios from 'axios';
import { refreshAuthTokens } from './tokenRefresh';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

describe('refreshAuthTokens', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    localStorage.setItem('refreshToken', 'old-refresh-token');
  });

  it('shares one rotating refresh request and persists both replacement tokens', async () => {
    const response = {
      data: { data: { accessToken: 'new-access-token', refreshToken: 'new-refresh-token' } },
    };
    (axios.post as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(response), 0))
    );

    const [first, second] = await Promise.all([
      refreshAuthTokens('https://api.example.test'),
      refreshAuthTokens('https://api.example.test/api/v1'),
    ]);

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledWith(
      'https://api.example.test/api/v1/auth/refresh',
      { refreshToken: 'old-refresh-token' },
      { withCredentials: true }
    );
    expect(first).toEqual(response.data.data);
    expect(second).toEqual(response.data.data);
    expect(localStorage.getItem('accessToken')).toBe('new-access-token');
    expect(localStorage.getItem('refreshToken')).toBe('new-refresh-token');
  });
});
