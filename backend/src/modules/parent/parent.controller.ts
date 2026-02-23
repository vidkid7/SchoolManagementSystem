import { Request, Response, NextFunction } from 'express';
import parentService from './parent.service';
import { logger } from '@utils/logger';

export const getChildren = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parentUserId = req.user?.userId;

    if (!parentUserId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const children = await parentService.getParentChildren(parentUserId);

    res.status(200).json({
      success: true,
      data: children,
      message: 'Children retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching parent children:', error);
    next(error);
  }
};

export const getChildAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parentUserId = req.user?.userId;
    const childId = parseInt(req.params.childId, 10);

    if (!parentUserId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (isNaN(childId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid child ID',
      });
      return;
    }

    const attendance = await parentService.getChildAttendance(childId, parentUserId);

    res.status(200).json({
      success: true,
      data: attendance,
      message: 'Attendance retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching child attendance:', error);
    if (error instanceof Error && error.message.includes('Access denied')) {
      res.status(403).json({
        success: false,
        message: error.message,
      });
      return;
    }
    next(error);
  }
};

export const getChildGrades = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parentUserId = req.user?.userId;
    const childId = parseInt(req.params.childId, 10);

    if (!parentUserId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (isNaN(childId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid child ID',
      });
      return;
    }

    const grades = await parentService.getChildGrades(childId, parentUserId);

    res.status(200).json({
      success: true,
      data: grades,
      message: 'Grades retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching child grades:', error);
    if (error instanceof Error && error.message.includes('Access denied')) {
      res.status(403).json({
        success: false,
        message: error.message,
      });
      return;
    }
    next(error);
  }
};

export const getChildFees = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parentUserId = req.user?.userId;
    const childId = parseInt(req.params.childId, 10);

    if (!parentUserId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (isNaN(childId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid child ID',
      });
      return;
    }

    const fees = await parentService.getChildFees(childId, parentUserId);

    res.status(200).json({
      success: true,
      data: fees,
      message: 'Fees retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching child fees:', error);
    if (error instanceof Error && error.message.includes('Access denied')) {
      res.status(403).json({
        success: false,
        message: error.message,
      });
      return;
    }
    next(error);
  }
};

export const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parentUserId = req.user?.userId;
    const childId = req.query.childId ? parseInt(req.query.childId as string, 10) : undefined;

    if (!parentUserId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const notifications = await parentService.getParentNotifications(parentUserId, childId);

    res.status(200).json({
      success: true,
      data: notifications,
      message: 'Notifications retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching parent notifications:', error);
    next(error);
  }
};

export const getDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parentUserId = req.user?.userId;

    if (!parentUserId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const children = await parentService.getParentChildren(parentUserId);

    const dashboardData = {
      children,
      totalChildren: children.length,
    };

    res.status(200).json({
      success: true,
      data: dashboardData,
      message: 'Dashboard data retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching parent dashboard:', error);
    next(error);
  }
};

export const getChildSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parentUserId = req.user?.userId;
    const childId = parseInt(req.params.childId, 10);

    if (!parentUserId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (isNaN(childId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid child ID',
      });
      return;
    }

    const [attendance, grades, fees, notifications] = await Promise.all([
      parentService.getChildAttendance(childId, parentUserId),
      parentService.getChildGrades(childId, parentUserId),
      parentService.getChildFees(childId, parentUserId),
      parentService.getParentNotifications(parentUserId, childId),
    ]);

    res.status(200).json({
      success: true,
      data: {
        attendance,
        grades,
        fees,
        notifications,
      },
      message: 'Child summary retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching child summary:', error);
    if (error instanceof Error && error.message.includes('Access denied')) {
      res.status(403).json({
        success: false,
        message: error.message,
      });
      return;
    }
    next(error);
  }
};
