import { Request, Response, NextFunction } from 'express';
import { AuthenticationError, AuthorizationError } from './errorHandler';
import authService from '@modules/auth/auth.service';
import { logger } from '@utils/logger';
import { UserRole } from '@models/User.model';

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user data to request
 * Requirements: 1.4, 36.7
 */
export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = authService.verifyAccessToken(token);

    // Attach user data to request
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role
    };

    // Log successful authentication
    logger.debug('User authenticated', {
      userId: decoded.userId,
      role: decoded.role,
      path: req.path,
      method: req.method
    });

    next();
  } catch (error) {
    logger.error('Authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: req.path,
      method: req.method,
      ip: req.ip
    });
    next(error);
  }
};

/**
 * Role-Based Authorization Middleware Factory
 * Creates middleware that checks if user has required role(s)
 * Requirements: 1.4, 1.5, 36.7
 * 
 * @param allowedRoles - Array of roles that can access the route
 * @returns Middleware function
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    // Case-insensitive role comparison
    const userRoleLower = req.user.role.toLowerCase();
    const hasPermission = allowedRoles.some(role => role.toLowerCase() === userRoleLower);
    
    if (!hasPermission) {
      logger.warn('Authorization failed', {
        userId: req.user.userId,
        username: req.user.username,
        role: req.user.role,
        requiredRoles: allowedRoles,
        path: req.path,
        method: req.method
      });

      return next(
        new AuthorizationError('You do not have permission to perform this action')
      );
    }

    logger.debug('User authorized', {
      userId: req.user.userId,
      role: req.user.role,
      path: req.path
    });

    next();
  };
};

/**
 * Permission-Based Authorization Middleware Factory
 * Creates middleware that checks if user has specific permission(s)
 * Requirements: 1.5, 36.7
 * 
 * @param requiredPermissions - Array of permissions required to access the route
 * @returns Middleware function
 */
export const requirePermissions = (...requiredPermissions: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    // Get user permissions from token or database
    const userPermissions = req.user.permissions || [];

    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every(permission =>
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      logger.warn('Permission check failed', {
        userId: req.user.userId,
        userPermissions,
        requiredPermissions,
        path: req.path,
        method: req.method
      });

      return next(
        new AuthorizationError('You do not have the required permissions')
      );
    }

    logger.debug('Permission check passed', {
      userId: req.user.userId,
      requiredPermissions,
      path: req.path
    });

    next();
  };
};

/**
 * Optional Authentication Middleware
 * Attaches user data if token is present, but doesn't fail if missing
 */
export const optionalAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = authService.verifyAccessToken(token);

      req.user = {
        userId: decoded.userId,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role
      };

      logger.debug('Optional auth: User authenticated', {
        userId: decoded.userId,
        path: req.path
      });
    }

    next();
  } catch {
    // Silently fail for optional auth
    next();
  }
};

/**
 * Self-Access Authorization Middleware
 * Ensures user can only access their own resources
 * Requirements: 36.7
 * 
 * @param userIdParam - Name of the route parameter containing user ID (default: 'userId')
 * @returns Middleware function
 */
export const requireSelfAccess = (userIdParam = 'userId') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    const targetUserId = parseInt(req.params[userIdParam], 10);

    if (isNaN(targetUserId)) {
      return next(new AuthorizationError('Invalid user ID'));
    }

    // Allow access if user is accessing their own resource or is an admin
    if (req.user.userId !== targetUserId && req.user.role !== 'School_Admin') {
      logger.warn('Self-access check failed', {
        userId: req.user.userId,
        targetUserId,
        path: req.path,
        method: req.method
      });

      return next(
        new AuthorizationError('You can only access your own resources')
      );
    }

    next();
  };
};

/**
 * Resource Ownership Authorization Middleware Factory
 * Ensures user owns the resource they're trying to access
 * Requirements: 36.7
 * 
 * @param getResourceOwnerId - Function to get owner ID from request
 * @returns Middleware function
 */
export const requireResourceOwnership = (
  getResourceOwnerId: (req: Request) => Promise<number | null>
) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(new AuthenticationError('Authentication required'));
      }

      const ownerId = await getResourceOwnerId(req);

      if (ownerId === null) {
        return next(new AuthorizationError('Resource not found'));
      }

      // Allow access if user owns the resource or is an admin
      if (req.user.userId !== ownerId && req.user.role !== 'School_Admin') {
        logger.warn('Resource ownership check failed', {
          userId: req.user.userId,
          ownerId,
          path: req.path,
          method: req.method
        });

        return next(
          new AuthorizationError('You do not own this resource')
        );
      }

      next();
    } catch (error) {
      logger.error('Error checking resource ownership', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId,
        path: req.path
      });
      next(error);
    }
  };
};
