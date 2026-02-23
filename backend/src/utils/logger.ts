import winston from 'winston';
import path from 'path';
import fs from 'fs';

/**
 * Winston Logger Configuration
 * Handles application and security logging
 */

// Ensure logs directory exists
const logsDir = path.resolve(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// Application logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    }),
    
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 10
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 30
    })
  ]
});

// Security logger (separate from application logs)
export const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.json()
  ),
  defaultMeta: { service: 'sms-security' },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'security-error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 10
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'security-audit.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 30
    })
  ]
});

// Security event types
export const SECURITY_EVENTS = {
  AUTH_SUCCESS: 'authentication_success',
  AUTH_FAILURE: 'authentication_failure',
  AUTH_LOCKOUT: 'account_lockout',
  PASSWORD_CHANGE: 'password_change',
  PASSWORD_RESET_REQUEST: 'password_reset_request',
  PASSWORD_RESET_SUCCESS: 'password_reset_success',
  PASSWORD_RESET_FAILURE: 'password_reset_failure',
  PERMISSION_DENIED: 'permission_denied',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  DATA_ACCESS: 'sensitive_data_access',
  DATA_EXPORT: 'data_export',
  ADMIN_ACTION: 'administrative_action',
  PAYMENT_ATTEMPT: 'payment_attempt',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded'
} as const;

export type SecurityEventType = typeof SECURITY_EVENTS[keyof typeof SECURITY_EVENTS];

interface SecurityEventData {
  event: SecurityEventType;
  userId?: string | number;
  userEmail?: string;
  userRole?: string;
  ip?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  outcome?: 'success' | 'failure';
  details?: Record<string, unknown>;
}

/**
 * Log security event
 */
export const logSecurityEvent = (data: SecurityEventData): void => {
  const logData = {
    ...data,
    timestamp: new Date().toISOString(),
    userId: data.userId || 'anonymous',
    userEmail: data.userEmail || 'unknown',
    userRole: data.userRole || 'unknown'
  };

  if (
    data.event.includes('failure') ||
    data.event.includes('denied') ||
    data.event.includes('suspicious')
  ) {
    securityLogger.warn(logData);
  } else {
    securityLogger.info(logData);
  }
};

// Suppress logs in test environment
if (process.env.NODE_ENV === 'test') {
  logger.transports.forEach(transport => {
    transport.silent = true;
  });
  securityLogger.transports.forEach(transport => {
    transport.silent = true;
  });
}

export default logger;
