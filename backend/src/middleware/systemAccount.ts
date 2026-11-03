import { NextFunction, Request, Response } from 'express';
import { AuthorizationError } from './errorHandler';
import { UserRole } from '@models/User.model';
import { logger } from '@utils/logger';

export function requireSystemAccount(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user?.isSystemAccount || req.user.role !== UserRole.MUNICIPALITY_ADMIN) {
    return next(new AuthorizationError('This operation is reserved for the protected system account'));
  }
  next();
}

export function authorizeBackupAccess(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  logger.warn('Database backup access denied', {
    userId: req.user?.userId,
    role: req.user?.role,
    path: req.path,
  });
  next(new AuthorizationError('Whole-database backup access is disabled. Use the school-scoped backup tools.'));
}
