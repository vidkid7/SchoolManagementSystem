/**
 * User API Service
 * 
 * API calls for user management
 */

import { apiClient } from '../apiClient';

export interface User {
  userId: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  roleName: string;
  status: string;
  avatar?: string;
}

class UserApiService {
  private baseUrl = '/api/v1/users';

  /**
   * Get all users with filters
   */
  async getUsers(params?: {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    users: User[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const response = await apiClient.get(this.baseUrl, { params });
    return {
      users: response.data.data || [],
      meta: response.data.meta || { 
        page: params?.page || 1, 
        limit: params?.limit || 20, 
        total: 0, 
        totalPages: 0 
      },
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: number): Promise<User> {
    const response = await apiClient.get(`${this.baseUrl}/${userId}`);
    return response.data.data;
  }
}

export const userApi = new UserApiService();
