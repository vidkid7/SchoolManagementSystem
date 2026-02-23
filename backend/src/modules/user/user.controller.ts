/**
 * User Controller
 * 
 * HTTP request handlers for user management operations
 */

import { Request, Response } from 'express';
import { UserService } from './user.service';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Get all users with filters
   * GET /api/v1/users
   */
  getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters = {
        search: req.query.search as string,
        role: req.query.role as string,
        status: req.query.status as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
      };

      const result = await this.userService.getAllUsers(filters);
      
      res.status(200).json({
        success: true,
        data: result.users,
        meta: {
          total: result.total,
          page: filters.page,
          limit: filters.limit,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to fetch users',
        },
      });
    }
  };

  /**
   * Get user by ID
   * GET /api/v1/users/:id
   */
  getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.params.id);
      const user = await this.userService.getUserById(userId);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: error instanceof Error ? error.message : 'User not found',
        },
      });
    }
  };

  /**
   * Create new user
   * POST /api/v1/users
   */
  createUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await this.userService.createUser(req.body);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'USER_CREATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create user',
        },
      });
    }
  };

  /**
   * Update user
   * PUT /api/v1/users/:id
   */
  updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.params.id);
      const user = await this.userService.updateUser(userId, req.body);

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: user,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'USER_UPDATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to update user',
        },
      });
    }
  };

  /**
   * Delete user
   * DELETE /api/v1/users/:id
   */
  deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.params.id);
      await this.userService.deleteUser(userId);

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'USER_DELETE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to delete user',
        },
      });
    }
  };

  /**
   * Reset user password
   * POST /api/v1/users/:id/reset-password
   */
  resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.params.id);
      await this.userService.resetPassword(userId);

      res.status(200).json({
        success: true,
        message: 'Password reset email sent successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'PASSWORD_RESET_FAILED',
          message: error instanceof Error ? error.message : 'Failed to reset password',
        },
      });
    }
  };

  /**
   * Get user activity log
   * GET /api/v1/users/:id/activity
   */
  getUserActivity = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.params.id);
      const activity = await this.userService.getUserActivity(userId);

      res.status(200).json({
        success: true,
        data: activity,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'ACTIVITY_FETCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to fetch user activity',
        },
      });
    }
  };

  /**
   * Get user statistics
   * GET /api/v1/users/stats
   */
  getUserStats = async (_req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.userService.getUserStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'STATS_FETCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to fetch user statistics',
        },
      });
    }
  };
}

export default new UserController();
