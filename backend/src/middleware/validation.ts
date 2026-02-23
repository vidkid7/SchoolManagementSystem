import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';
import { validationResult, ValidationChain } from 'express-validator';
import { ValidationError } from './errorHandler';
import xss from 'xss';
import crypto from 'crypto';

/**
 * Validation target type
 */
type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Validation Middleware Factory (Joi-based)
 * Creates middleware that validates request data against Joi schema
 * @param schema - Joi validation schema
 * @param target - Which part of request to validate (body, query, params)
 */
export const validate = (schema: Schema, target: ValidationTarget = 'body') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const dataToValidate = req[target];

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true // Remove unknown fields
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return next(new ValidationError('Validation failed', errors));
    }

    // Replace request data with validated and sanitized data
    req[target] = value;

    next();
  };
};

/**
 * Express-Validator Middleware
 * Validates request using express-validator chains and returns formatted errors
 * Requirements: 1.4, 36.7
 * 
 * @param validations - Array of express-validator validation chains
 * @returns Middleware function
 */
export const validateRequest = (validations: ValidationChain[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    // Check for validation errors
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map(error => ({
        field: error.type === 'field' ? error.path : 'unknown',
        message: error.msg
      }));

      return next(new ValidationError('Validation failed', formattedErrors));
    }

    next();
  };
};

/**
 * Sanitization Middleware
 * Sanitizes request data to prevent XSS and injection attacks
 * Requirements: 36.6
 * 
 * @param req - Express request
 * @param _res - Express response
 * @param next - Next function
 */
export const sanitizeRequest = (req: Request, _res: Response, next: NextFunction): void => {
  // Sanitize body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query) as typeof req.query;
  }

  // Sanitize params
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params) as typeof req.params;
  }

  next();
};

/**
 * Recursively sanitize object properties
 * Removes potentially dangerous characters and patterns
 * Implements XSS prevention using xss library
 * 
 * @param obj - Object to sanitize
 * @returns Sanitized object
 */
function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Remove null bytes
      let sanitizedValue = value.replace(/\0/g, '');
      
      // Trim whitespace
      sanitizedValue = sanitizedValue.trim();
      
      // XSS Prevention: Sanitize HTML/JavaScript using xss library
      // This removes dangerous HTML tags and JavaScript code
      sanitizedValue = xss(sanitizedValue, {
        whiteList: {}, // No HTML tags allowed by default
        stripIgnoreTag: true, // Remove all tags
        stripIgnoreTagBody: false // Keep text content
      });
      
      sanitized[key] = sanitizedValue;
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => {
        if (typeof item === 'string') {
          // Sanitize string items in array
          let sanitizedItem = item.replace(/\0/g, '').trim();
          sanitizedItem = xss(sanitizedItem, {
            whiteList: {},
            stripIgnoreTag: true,
            stripIgnoreTagBody: false
          });
          return sanitizedItem;
        } else if (typeof item === 'object' && item !== null) {
          return sanitizeObject(item as Record<string, unknown>);
        }
        return item;
      });
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitize HTML content for fields that need to allow some HTML
 * (e.g., rich text editors for announcements, descriptions)
 * Requirements: 36.6
 * 
 * @param html - HTML string to sanitize
 * @param allowedTags - Array of allowed HTML tags
 * @returns Sanitized HTML string
 */
export const sanitizeHtml = (
  html: string,
  allowedTags: string[] = ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li']
): string => {
  const whiteList: Record<string, string[]> = {};
  allowedTags.forEach(tag => {
    whiteList[tag] = ['href', 'target', 'rel']; // Only safe attributes
  });
  
  return xss(html, {
    whiteList,
    stripIgnoreTag: false,
    stripIgnoreTagBody: false
  });
};

/**
 * CSRF Token Generation and Validation
 * Implements double-submit cookie pattern for CSRF protection
 * Requirements: 36.5
 */

/**
 * Generate CSRF token
 * @returns CSRF token string
 */
export const generateCsrfToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * CSRF Protection Middleware
 * Validates CSRF token using double-submit cookie pattern
 * Requirements: 36.5
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
export const csrfProtection = (req: Request, _res: Response, next: NextFunction): void => {
  // Skip CSRF check for safe methods (GET, HEAD, OPTIONS)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Get CSRF token from cookie
  const cookieToken = req.cookies?.['csrf-token'];
  
  // Get CSRF token from header or body
  const headerToken = req.headers['x-csrf-token'] as string;
  const bodyToken = req.body?.csrfToken;
  
  const requestToken = headerToken || bodyToken;

  // Validate token exists
  if (!cookieToken || !requestToken) {
    return next(new ValidationError('CSRF token missing', [
      {
        field: 'csrfToken',
        message: 'CSRF token is required for this operation'
      }
    ]));
  }

  // Validate tokens match (double-submit cookie pattern)
  if (cookieToken !== requestToken) {
    return next(new ValidationError('CSRF token invalid', [
      {
        field: 'csrfToken',
        message: 'CSRF token validation failed'
      }
    ]));
  }

  next();
};

/**
 * Middleware to set CSRF token cookie
 * Should be applied to routes that need CSRF protection
 * Requirements: 36.5
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
export const setCsrfToken = (req: Request, res: Response, next: NextFunction): void => {
  // Generate new token if not exists
  if (!req.cookies?.['csrf-token']) {
    const token = generateCsrfToken();
    
    // Set cookie with secure options
    res.cookie('csrf-token', token, {
      httpOnly: false, // Must be accessible to JavaScript for sending in requests
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict', // CSRF protection
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    // Also send token in response for client to use
    res.locals.csrfToken = token;
  } else {
    res.locals.csrfToken = req.cookies['csrf-token'];
  }
  
  next();
};

/**
 * SQL Injection Prevention Validator
 * Detects common SQL injection patterns in input
 * Note: This is a secondary defense. Primary defense is parameterized queries.
 * Requirements: 36.6
 * 
 * @param input - String to validate
 * @returns True if suspicious patterns detected
 */
export const detectSqlInjection = (input: string): boolean => {
  const sqlInjectionPatterns = [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(from|into|table|database|where)\b)/i,
    /(\bor\b.*=.*)/i,
    /(\band\b.*=.*)/i,
    /(--|;|#|\/\*|\*\/)/,  // Added # for MySQL comments
    /(\bxp_|\bsp_)/i,
    /('|")\s*(or|and)\s*('|")\s*=\s*('|")/i
  ];

  return sqlInjectionPatterns.some(pattern => pattern.test(input));
};

/**
 * Middleware to detect and block SQL injection attempts
 * Requirements: 36.6
 * 
 * @param req - Express request
 * @param _res - Express response
 * @param next - Next function
 */
export const sqlInjectionProtection = (req: Request, _res: Response, next: NextFunction): void => {
  const checkObject = (obj: Record<string, unknown>, path = ''): string | null => {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (typeof value === 'string') {
        if (detectSqlInjection(value)) {
          return currentPath;
        }
      } else if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          if (typeof value[i] === 'string' && detectSqlInjection(value[i])) {
            return `${currentPath}[${i}]`;
          } else if (typeof value[i] === 'object' && value[i] !== null) {
            const result = checkObject(value[i] as Record<string, unknown>, `${currentPath}[${i}]`);
            if (result) return result;
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        const result = checkObject(value as Record<string, unknown>, currentPath);
        if (result) return result;
      }
    }
    return null;
  };

  // Check body
  if (req.body && typeof req.body === 'object') {
    const suspiciousField = checkObject(req.body);
    if (suspiciousField) {
      return next(new ValidationError('Suspicious input detected', [
        {
          field: suspiciousField,
          message: 'Input contains potentially dangerous patterns'
        }
      ]));
    }
  }

  // Check query
  if (req.query && typeof req.query === 'object') {
    const suspiciousField = checkObject(req.query as Record<string, unknown>);
    if (suspiciousField) {
      return next(new ValidationError('Suspicious input detected', [
        {
          field: suspiciousField,
          message: 'Input contains potentially dangerous patterns'
        }
      ]));
    }
  }

  // Check params
  if (req.params && typeof req.params === 'object') {
    const suspiciousField = checkObject(req.params);
    if (suspiciousField) {
      return next(new ValidationError('Suspicious input detected', [
        {
          field: suspiciousField,
          message: 'Input contains potentially dangerous patterns'
        }
      ]));
    }
  }

  next();
};
