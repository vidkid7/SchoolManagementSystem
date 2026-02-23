import { Request, Response, NextFunction } from 'express';
import teacherService from './teacher.service';
import { logger } from '@utils/logger';

export const getDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const staff = await teacherService.getStaffFromUserId(userId);

    if (!staff) {
      res.status(404).json({
        success: false,
        message: 'Staff profile not found for this user',
      });
      return;
    }

    const [schedule, tasks, performances, trend, stats, notifications] = await Promise.all([
      teacherService.getTodaySchedule(staff.staffId),
      teacherService.getPendingTasks(staff.staffId),
      teacherService.getClassPerformance(staff.staffId),
      teacherService.getAttendanceTrend(staff.staffId),
      teacherService.getTeacherStats(staff.staffId),
      teacherService.getNotifications(staff.staffId),
    ]);

    res.status(200).json({
      success: true,
      data: {
        schedule,
        tasks,
        performances,
        trend,
        stats,
        notifications,
      },
      message: 'Teacher dashboard data retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching teacher dashboard:', error);
    next(error);
  }
};

export const getTodaySchedule = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const staff = await teacherService.getStaffFromUserId(userId);

    if (!staff) {
      res.status(404).json({
        success: false,
        message: 'Staff profile not found',
      });
      return;
    }

    const schedule = await teacherService.getTodaySchedule(staff.staffId);

    res.status(200).json({
      success: true,
      data: schedule,
      message: 'Today\'s schedule retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching today\'s schedule:', error);
    next(error);
  }
};

export const getPendingTasks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const staff = await teacherService.getStaffFromUserId(userId);

    if (!staff) {
      res.status(404).json({
        success: false,
        message: 'Staff profile not found',
      });
      return;
    }

    const tasks = await teacherService.getPendingTasks(staff.staffId);

    res.status(200).json({
      success: true,
      data: tasks,
      message: 'Pending tasks retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching pending tasks:', error);
    next(error);
  }
};

export const getClassPerformance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const staff = await teacherService.getStaffFromUserId(userId);

    if (!staff) {
      res.status(404).json({
        success: false,
        message: 'Staff profile not found',
      });
      return;
    }

    const performances = await teacherService.getClassPerformance(staff.staffId);

    res.status(200).json({
      success: true,
      data: performances,
      message: 'Class performance retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching class performance:', error);
    next(error);
  }
};

export const getStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const staff = await teacherService.getStaffFromUserId(userId);

    if (!staff) {
      res.status(404).json({
        success: false,
        message: 'Staff profile not found',
      });
      return;
    }

    const stats = await teacherService.getTeacherStats(staff.staffId);

    res.status(200).json({
      success: true,
      data: stats,
      message: 'Teacher stats retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching teacher stats:', error);
    next(error);
  }
};

export const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const staff = await teacherService.getStaffFromUserId(userId);

    if (!staff) {
      res.status(404).json({
        success: false,
        message: 'Staff profile not found',
      });
      return;
    }

    const notifications = await teacherService.getNotifications(staff.staffId);

    res.status(200).json({
      success: true,
      data: notifications,
      message: 'Notifications retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    next(error);
  }
};
