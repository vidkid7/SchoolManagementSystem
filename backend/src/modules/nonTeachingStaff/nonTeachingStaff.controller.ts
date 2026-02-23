import { Request, Response } from 'express';
import User, { UserRole } from '@models/User.model';
import { logger } from '@utils/logger';

class NonTeachingStaffController {
  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const user = await User.findByPk(userId, {
        attributes: ['id', 'username', 'email', 'firstName', 'lastName', 'phoneNumber', 'role', 'status']
      });

      res.status(200).json({
        success: true,
        data: {
          profile: user,
          role: UserRole.NON_TEACHING_STAFF,
          quickLinks: [
            { label: 'Communication', path: '/communication/messages' },
            { label: 'Announcements', path: '/communication/announcements' },
            { label: 'Calendar', path: '/calendar' },
            { label: 'Documents', path: '/documents' }
          ]
        }
      });
    } catch (error: any) {
      logger.error('Non-teaching staff dashboard error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'STAFF_DASHBOARD_ERROR', message: error.message || 'Failed to load dashboard' }
      });
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const user = await User.findByPk(userId, {
        attributes: ['id', 'username', 'email', 'firstName', 'lastName', 'phoneNumber', 'role', 'status', 'createdAt']
      });

      if (!user) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
        return;
      }

      res.status(200).json({ success: true, data: user });
    } catch (error: any) {
      logger.error('Non-teaching staff profile error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'PROFILE_ERROR', message: error.message || 'Failed to load profile' }
      });
    }
  }
}

export default new NonTeachingStaffController();
