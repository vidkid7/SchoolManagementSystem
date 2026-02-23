import { Response } from 'express';
import { HTTP_STATUS, ERROR_CODES, ErrorCodeType } from '@config/constants';

/**
 * API Response Formatter
 * Ensures consistent response structure across all endpoints
 */

interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

interface ErrorResponse {
  success: false;
  message: string;
  code: ErrorCodeType;
  errors?: ValidationError[];
  stack?: string;
}

interface ValidationError {
  field: string;
  message: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Send success response
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = HTTP_STATUS.OK as number,
  meta?: PaginationMeta
): Response => {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
    ...(meta && { meta })
  };

  return res.status(statusCode).json(response);
};

/**
 * Send error response
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  code: ErrorCodeType = ERROR_CODES.INTERNAL_ERROR,
  errors?: ValidationError[]
): Response => {
  const response: ErrorResponse = {
    success: false,
    message,
    code,
    ...(errors && { errors })
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development' && res.locals.error) {
    response.stack = res.locals.error.stack;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send validation error response
 */
export const sendValidationError = (
  res: Response,
  errors: ValidationError[]
): Response => {
  return sendError(
    res,
    'Validation failed',
    HTTP_STATUS.BAD_REQUEST as number,
    ERROR_CODES.VALIDATION_ERROR,
    errors
  );
};

/**
 * Send not found response
 */
export const sendNotFound = (
  res: Response,
  resource = 'Resource'
): Response => {
  return sendError(
    res,
    `${resource} not found`,
    HTTP_STATUS.NOT_FOUND as number,
    ERROR_CODES.RESOURCE_NOT_FOUND
  );
};

/**
 * Send unauthorized response
 */
export const sendUnauthorized = (
  res: Response,
  message = 'Authentication required'
): Response => {
  return sendError(
    res,
    message,
    HTTP_STATUS.UNAUTHORIZED as number,
    ERROR_CODES.AUTHENTICATION_REQUIRED
  );
};

/**
 * Send forbidden response
 */
export const sendForbidden = (
  res: Response,
  message = 'You do not have permission to perform this action'
): Response => {
  return sendError(
    res,
    message,
    HTTP_STATUS.FORBIDDEN as number,
    ERROR_CODES.PERMISSION_DENIED
  );
};

/**
 * Send conflict response
 */
export const sendConflict = (
  res: Response,
  message: string
): Response => {
  return sendError(
    res,
    message,
    HTTP_STATUS.CONFLICT as number,
    ERROR_CODES.RESOURCE_CONFLICT
  );
};

/**
 * Calculate pagination metadata
 */
export const calculatePagination = (
  total: number,
  page: number,
  limit: number
): PaginationMeta => {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  };
};

export default {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendConflict,
  calculatePagination
};
