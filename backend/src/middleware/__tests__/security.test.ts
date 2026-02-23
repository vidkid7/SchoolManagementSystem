import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import {
  disablePoweredBy,
  xssProtection,
  detectSuspiciousActivity
} from '../security';

describe('Security Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      query: {},
      params: {},
      headers: {}
    };
    mockResponse = {
      removeHeader: jest.fn() as any,
      setHeader: jest.fn() as any
    };
    mockNext = jest.fn();
  });

  describe('disablePoweredBy', () => {
    it('should remove X-Powered-By header', () => {
      disablePoweredBy(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.removeHeader).toHaveBeenCalledWith('X-Powered-By');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('xssProtection', () => {
    it('should set XSS protection headers', () => {
      xssProtection(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('detectSuspiciousActivity', () => {
    it('should detect SQL injection patterns in body', () => {
      mockRequest.body = {
        username: "admin' UNION SELECT * FROM users--",
        password: 'password'
      };

      const result = detectSuspiciousActivity(mockRequest as Request);

      expect(result).toBe(true);
    });

    it('should detect UNION-based SQL injection', () => {
      mockRequest.body = {
        search: "' UNION SELECT * FROM users--"
      };

      const result = detectSuspiciousActivity(mockRequest as Request);

      expect(result).toBe(true);
    });

    it('should detect XSS patterns', () => {
      mockRequest.body = {
        comment: '<script>alert("xss")</script>'
      };

      const result = detectSuspiciousActivity(mockRequest as Request);

      expect(result).toBe(true);
    });

    it('should detect javascript: protocol', () => {
      mockRequest.body = {
        link: 'javascript:alert("xss")'
      };

      const result = detectSuspiciousActivity(mockRequest as Request);

      expect(result).toBe(true);
    });

    it('should detect event handlers', () => {
      mockRequest.body = {
        html: '<div onclick="alert(1)">Click</div>'
      };

      const result = detectSuspiciousActivity(mockRequest as Request);

      expect(result).toBe(true);
    });

    it('should detect path traversal attempts', () => {
      mockRequest.query = {
        file: '../../../etc/passwd'
      };

      const result = detectSuspiciousActivity(mockRequest as Request);

      expect(result).toBe(true);
    });

    it('should detect null byte injection', () => {
      mockRequest.params = {
        filename: 'file.txt%00.jpg'
      };

      const result = detectSuspiciousActivity(mockRequest as Request);

      expect(result).toBe(true);
    });

    it('should allow safe input', () => {
      mockRequest.body = {
        username: 'john_doe',
        email: 'john@example.com',
        description: 'This is a safe description with numbers 123'
      };

      const result = detectSuspiciousActivity(mockRequest as Request);

      expect(result).toBe(false);
    });

    it('should detect suspicious patterns in query parameters', () => {
      mockRequest.query = {
        filter: "SELECT * FROM users"
      };

      const result = detectSuspiciousActivity(mockRequest as Request);

      expect(result).toBe(true);
    });

    it('should detect suspicious patterns in nested objects', () => {
      mockRequest.body = {
        user: {
          profile: {
            bio: "'; DROP TABLE users;--"
          }
        }
      };

      const result = detectSuspiciousActivity(mockRequest as Request);

      expect(result).toBe(true);
    });

    it('should handle empty request data', () => {
      mockRequest.body = {};
      mockRequest.query = {};
      mockRequest.params = {};

      const result = detectSuspiciousActivity(mockRequest as Request);

      expect(result).toBe(false);
    });

    it('should detect multiple suspicious patterns', () => {
      mockRequest.body = {
        field1: '<script>alert(1)</script>',
        field2: "' OR '1'='1",
        field3: '../../../etc/passwd'
      };

      const result = detectSuspiciousActivity(mockRequest as Request);

      expect(result).toBe(true);
    });
  });
});

describe('Security Headers - Helmet Configuration', () => {
  it('should have proper CSP directives for Nepal payment gateways', () => {
    // This test verifies the configuration exists
    // Actual helmet middleware testing would require integration tests
    const { helmetMiddleware } = require('../security');
    
    expect(helmetMiddleware).toBeDefined();
  });
});

describe('CORS Configuration', () => {
  it('should have proper CORS configuration', () => {
    const { corsMiddleware } = require('../security');
    
    expect(corsMiddleware).toBeDefined();
  });
});

describe('HPP Configuration', () => {
  it('should have HTTP Parameter Pollution prevention', () => {
    const { hppMiddleware } = require('../security');
    
    expect(hppMiddleware).toBeDefined();
  });
});

describe('Compression Configuration', () => {
  it('should have compression middleware configured', () => {
    const { compressionMiddleware } = require('../security');
    
    expect(compressionMiddleware).toBeDefined();
  });
});
