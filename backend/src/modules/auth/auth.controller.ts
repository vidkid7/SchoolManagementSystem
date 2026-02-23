import { Request, Response } from 'express';
import authService from './auth.service';
import { sendSuccess } from '@utils/responseFormatter';
import { asyncHandler } from '@middleware/errorHandler';

/**
 * Authentication Controller
 * Handles HTTP requests for authentication endpoints
 */
class AuthController {
  /**
   * Register new user
   * POST /api/v1/auth/register
   */
  register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { username, email, password, role, phoneNumber } = req.body;

    const user = await authService.register({
      username,
      email,
      password,
      role,
      phoneNumber
    });

    sendSuccess(
      res,
      user,
      'User registered successfully',
      201 // HTTP_STATUS.CREATED
    );
  });

  /**
   * Login user
   * POST /api/v1/auth/login
   */
  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { username, password, rememberMe } = req.body;

    const result = await authService.login(username, password, rememberMe);

    sendSuccess(
      res,
      result,
      'Login successful',
      200 // HTTP_STATUS.OK
    );
  });

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   */
  refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;

    const tokens = await authService.refreshAccessToken(refreshToken);

    sendSuccess(
      res,
      tokens,
      'Token refreshed successfully',
      200 // HTTP_STATUS.OK
    );
  });

  /**
   * Logout user
   * POST /api/v1/auth/logout
   */
  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const userId = req.user!.userId;

    await authService.logout(userId);

    sendSuccess(
      res,
      null,
      'Logout successful',
      200 // HTTP_STATUS.OK
    );
  });

  /**
   * Change password
   * POST /api/v1/auth/change-password
   */
  changePassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = req.body;

    await authService.changePassword(userId, currentPassword, newPassword);

    sendSuccess(
      res,
      null,
      'Password changed successfully',
      200 // HTTP_STATUS.OK
    );
  });

  /**
   * Get current user profile
   * GET /api/v1/auth/me
   */
  getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const userId = req.user!.userId;

    const user = await authService.getUserById(userId);

    sendSuccess(
      res,
      user,
      'Profile retrieved successfully',
      200 // HTTP_STATUS.OK
    );
  });

  /**
   * Forgot password - request password reset
   * POST /api/v1/auth/forgot-password
   */
  forgotPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

    const result = await authService.forgotPassword(email);

    sendSuccess(
      res,
      result,
      result.message,
      200 // HTTP_STATUS.OK
    );
  });

  /**
   * Reset password using reset token
   * POST /api/v1/auth/reset-password
   */
  resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { token, newPassword } = req.body;

    await authService.resetPassword(token, newPassword);

    sendSuccess(
      res,
      null,
      'Password reset successfully',
      200 // HTTP_STATUS.OK
    );
  });
}

export default new AuthController();
