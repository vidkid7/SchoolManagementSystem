import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import hpp from 'hpp';
import compression from 'compression';
import { env } from '@config/env';

/**
 * Security Middleware Configuration
 * Implements OWASP security best practices
 */

/**
 * Helmet - Security Headers
 */
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      connectSrc: [
        "'self'",
        'https://api.esewa.com.np',
        'https://khalti.com',
        'https://imepay.com.np'
      ],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false, // Allow embedding payment gateways
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

/**
 * CORS Configuration
 */
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (env.ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-School-Code', 'Cache-Control', 'Pragma'],
  credentials: true,
  maxAge: 86400 // 24 hours
});

/**
 * HTTP Parameter Pollution Prevention
 */
export const hppMiddleware = hpp({
  whitelist: ['sort', 'filter', 'page', 'limit', 'search']
});

/**
 * Compression Middleware
 * Optimized for low-bandwidth networks (2G/3G)
 * Requirements: 29.7, 29.9
 */
export const compressionMiddleware = compression({
  filter: (req: Request, res: Response) => {
    // Skip compression if explicitly disabled
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    // Always compress JSON responses (API payloads)
    if (res.getHeader('Content-Type')?.toString().includes('application/json')) {
      return true;
    }
    
    // Use default compression filter for other content types
    return compression.filter(req, res);
  },
  // Level 6 provides good balance between compression ratio and speed
  // Higher levels (7-9) provide minimal gains with significant CPU cost
  level: 6,
  // Compress responses larger than 1KB
  threshold: 1024,
  // Memory level (1-9): 8 is default, good for most cases
  memLevel: 8
});

/**
 * Disable X-Powered-By Header
 */
export const disablePoweredBy = (_req: Request, res: Response, next: NextFunction): void => {
  res.removeHeader('X-Powered-By');
  next();
};

/**
 * XSS Protection Headers
 */
export const xssProtection = (_req: Request, res: Response, next: NextFunction): void => {
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
};

/**
 * Suspicious Activity Detection
 */
export const detectSuspiciousActivity = (req: Request): boolean => {
  const suspiciousPatterns = [
    // SQL Injection patterns
    /(\b(union|select|insert|update|delete|drop|create|alter)\b.*\b(from|into|table|database)\b)/i,
    // XSS patterns
    /<script[^>]*>|javascript:|on\w+\s*=/i,
    // Path traversal
    /\.\.\//,
    // Null bytes
    /%00/
  ];

  const inputString = JSON.stringify({
    body: req.body,
    query: req.query,
    params: req.params
  });

  return suspiciousPatterns.some(pattern => pattern.test(inputString));
};

export default {
  helmetMiddleware,
  corsMiddleware,
  hppMiddleware,
  compressionMiddleware,
  disablePoweredBy,
  xssProtection,
  detectSuspiciousActivity
};
