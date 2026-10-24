import { Request, Response } from 'express';
import User, { UserRole } from '@models/User.model';
import { logger } from '@utils/logger';
import staffLeaveService from './staffLeave.service';
import staffPortalService from './staffPortal.service';

class NonTeachingStaffController {
  async getMyLeaveRequests(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }
      const leaves = await staffLeaveService.listForUser(userId);
      res.status(200).json({ success: true, data: { leaves, balance: null } });
    } catch (error) {
      const statusCode = (error as Error & { statusCode?: number }).statusCode ?? 500;
      logger.error('Non-teaching staff leave history error:', error);
      res.status(statusCode).json({ success: false, message: (error as Error).message || 'Failed to load leave requests' });
    }
  }

  async applyForLeave(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }
      const leave = await staffLeaveService.applyForUser(userId, req.body);
      res.status(201).json({ success: true, data: leave, message: 'Leave request submitted' });
    } catch (error) {
      const statusCode = (error as Error & { statusCode?: number }).statusCode ?? 500;
      logger.error('Non-teaching staff leave request error:', error);
      res.status(statusCode).json({ success: false, message: (error as Error).message || 'Failed to submit leave request' });
    }
  }

  async cancelLeaveRequest(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }
      const cancelled = await staffLeaveService.cancelForUser(userId, Number(req.params.requestId));
      if (!cancelled) { res.status(404).json({ success: false, message: 'Leave request not found' }); return; }
      res.status(200).json({ success: true, data: { cancelled: true } });
    } catch (error) {
      const statusCode = (error as Error & { statusCode?: number }).statusCode ?? 500;
      logger.error('Non-teaching staff leave cancellation error:', error);
      res.status(statusCode).json({ success: false, message: (error as Error).message || 'Failed to cancel leave request' });
    }
  }

  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const user = await User.findByPk(userId, {
        attributes: ['user_id', 'username', 'email', 'role', 'status', 'phone_number']
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
        attributes: ['user_id', 'username', 'email', 'role', 'status', 'phone_number', 'createdAt']
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

  // ─────────────────── TASK MANAGEMENT ───────────────────

  async getTasks(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const tasks = await staffPortalService.listTasks(userId, status);
      res.status(200).json({ success: true, data: { tasks, total: tasks.length } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'TASK_LIST_ERROR', message: error.message } });
    }
  }

  async getAllTasks(_req: Request, res: Response): Promise<void> {
    try {
      const tasks = await staffPortalService.listAllTasks();
      res.status(200).json({ success: true, data: { tasks, total: tasks.length } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'TASK_LIST_ERROR', message: error.message } });
    }
  }

  async createTask(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }
      const task = await staffPortalService.createTask(userId, req.body);
      res.status(201).json({ success: true, data: task });
    } catch (error: any) {
      const statusCode = error.statusCode ?? 500;
      if (statusCode === 500) logger.error('Non-teaching task create error:', error);
      res.status(statusCode).json({ success: false, error: { code: statusCode === 400 ? 'VALIDATION_ERROR' : 'TASK_CREATE_ERROR', message: error.message || 'Failed to create task' } });
    }
  }

  async updateTaskStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }
      const updated = await staffPortalService.updateTaskStatus(
        Number(req.params.taskId), userId, req.user?.role === UserRole.SCHOOL_ADMIN,
        req.body.status, req.body.completionNote,
      );
      if (!updated) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Task not found' } }); return; }
      res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      logger.error('Non-teaching task update error:', error);
      res.status(500).json({ success: false, error: { code: 'TASK_UPDATE_ERROR', message: error.message } });
    }
  }

  // ─────────────────── WORK SCHEDULE ───────────────────

  async getSchedule(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }
      const schedules = await staffPortalService.listSchedule(userId, typeof req.query.week === 'string' ? req.query.week : undefined);
      res.status(200).json({ success: true, data: { schedule: schedules, total: schedules.length } });
    } catch (error: any) {
      const statusCode = error.statusCode ?? 500;
      res.status(statusCode).json({ success: false, error: { code: statusCode === 400 ? 'VALIDATION_ERROR' : 'SCHEDULE_GET_ERROR', message: error.message } });
    }
  }

  async setSchedule(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }
      const schedule = await staffPortalService.setSchedule(userId, req.body);
      res.status(200).json({ success: true, data: schedule });
    } catch (error: any) {
      const statusCode = error.statusCode ?? 500;
      if (statusCode === 500) logger.error('Non-teaching schedule update error:', error);
      res.status(statusCode).json({ success: false, error: { code: statusCode === 400 ? 'VALIDATION_ERROR' : 'SCHEDULE_SET_ERROR', message: error.message } });
    }
  }
}

export default new NonTeachingStaffController();
