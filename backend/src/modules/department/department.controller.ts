import { Request, Response, NextFunction } from 'express';
import departmentService from './department.service';
import { logger } from '@utils/logger';
import { sendSuccess } from '@utils/responseFormatter';
import { HTTP_STATUS } from '@config/constants';

export const getDepartmentTeachers = async (
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

    const result = await departmentService.getDepartmentTeachers(userId);

    sendSuccess(res, result, 'Department teachers retrieved successfully');
  } catch (error) {
    logger.error('Error fetching department teachers:', error);
    next(error);
  }
};

export const getDepartmentStats = async (
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

    const stats = await departmentService.getDepartmentStats(userId);

    sendSuccess(res, stats, 'Department statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching department stats:', error);
    next(error);
  }
};

export const getDepartmentPerformance = async (
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

    const performance = await departmentService.getDepartmentPerformance(userId);

    sendSuccess(res, performance, 'Department performance retrieved successfully');
  } catch (error) {
    logger.error('Error fetching department performance:', error);
    next(error);
  }
};
