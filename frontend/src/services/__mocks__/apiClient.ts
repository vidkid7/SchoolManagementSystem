// Mock API Client for Jest
// This mock replaces the actual apiClient.ts which uses import.meta.env.VITE_API_URL

export const apiClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
};

export default apiClient;

// Helper to set up default mock implementations
export const setupDefaultMocks = () => {
  (apiClient.get as jest.Mock).mockResolvedValue({
    data: { success: true, data: [], meta: { total: 0 } },
  });
  (apiClient.post as jest.Mock).mockResolvedValue({
    data: { success: true, data: {} },
  });
  (apiClient.put as jest.Mock).mockResolvedValue({
    data: { success: true, data: {} },
  });
  (apiClient.delete as jest.Mock).mockResolvedValue({
    data: { success: true, data: {} },
  });
};