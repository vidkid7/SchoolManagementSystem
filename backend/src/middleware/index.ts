/**
 * Middleware Index
 * Central export point for all middleware
 * Requirements: 1.4, 36.7
 */

// Authentication & Authorization
export {
  authenticate,
  authorize,
  requirePermissions,
  optionalAuth,
  requireSelfAccess,
  requireResourceOwnership
} from './auth';

// Validation
export {
  validate,
  validateRequest,
  sanitizeRequest
} from './validation';

// Error Handling
export {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError
} from './errorHandler';

// Security
export {
  helmetMiddleware,
  corsMiddleware,
  hppMiddleware,
  compressionMiddleware,
  disablePoweredBy,
  xssProtection,
  detectSuspiciousActivity
} from './security';
