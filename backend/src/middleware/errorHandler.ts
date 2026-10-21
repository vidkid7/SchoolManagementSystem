/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from 'express';
import { ValidationError as SequelizeValidationError } from 'sequelize';
import { logger } from '@utils/logger';
import { sendError } from '@utils/responseFormatter';
import { HTTP_STATUS, ERROR_CODES, ErrorCodeType } from '@config/constants';

/**
 * Custom Error Classes
 */

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    public code: string = ERROR_CODES.INTERNAL_ERROR,
    public isOperational = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public errors?: Array<{ field: string; message: string }>) {
    super(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTHENTICATION_REQUIRED);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.PERMISSION_DENIED);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_CONFLICT);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests. Please try again later.') {
    super(message, HTTP_STATUS.TOO_MANY_REQUESTS, ERROR_CODES.RATE_LIMIT_EXCEEDED);
  }
}

/**
 * Global Error Handler Middleware
 */
// eslint-disable-next-line max-lines-per-function
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): Response => {
  // Log error
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?.userId
  });

  // Handle Sequelize Validation Errors
  if (err instanceof SequelizeValidationError) {
    const errors = err.errors.map(e => ({
      field: e.path || 'unknown',
      message: e.message
    }));

    return sendError(
      res,
      'Validation failed',
      HTTP_STATUS.BAD_REQUEST as number,
      ERROR_CODES.VALIDATION_ERROR,
      errors
    );
  }

  // Handle Custom App Errors
  if (err instanceof AppError) {
    res.locals.error = err;
    
    if (err instanceof ValidationError) {
      return sendError(
        res,
        err.message,
        err.statusCode,
        err.code as ErrorCodeType,
        err.errors
      );
    }

    return sendError(
      res,
      err.message,
      err.statusCode,
      err.code as ErrorCodeType
    );
  }

  // Handle JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(
      res,
      'Invalid token',
      HTTP_STATUS.UNAUTHORIZED as number,
      ERROR_CODES.AUTHENTICATION_REQUIRED
    );
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(
      res,
      'Token expired',
      HTTP_STATUS.UNAUTHORIZED as number,
      ERROR_CODES.AUTHENTICATION_REQUIRED
    );
  }

  // Handle Multer Errors (File Upload)
  if (err.name === 'MulterError') {
    return sendError(
      res,
      `File upload error: ${err.message}`,
      HTTP_STATUS.BAD_REQUEST as number,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  // Default Internal Server Error
  res.locals.error = err;
  return sendError(
    res,
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message,
    HTTP_STATUS.INTERNAL_SERVER_ERROR as number,
    ERROR_CODES.INTERNAL_ERROR
  );
};

/**
 * 404 Not Found Handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response
): Response => {
  return sendError(
    res,
    `Route ${req.method} ${req.path} not found`,
    HTTP_STATUS.NOT_FOUND as number,
    ERROR_CODES.RESOURCE_NOT_FOUND
  );
};

/**
 * Async Handler Wrapper
 * Catches async errors and passes them to error handler
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default errorHandler;
