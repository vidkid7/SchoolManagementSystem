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
  if (req.user?.role === UserRole.SCHOOL_ADMIN) {
    return next();
  }

  if (req.user?.role === UserRole.MUNICIPALITY_ADMIN && req.user.isSystemAccount) {
    return next();
  }

  logger.warn('Database backup access denied', {
    userId: req.user?.userId,
    role: req.user?.role,
    path: req.path,
  });
  next(new AuthorizationError('Database backup access is not permitted for this account'));
}
