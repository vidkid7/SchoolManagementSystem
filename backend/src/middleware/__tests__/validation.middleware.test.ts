import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { validationResult } from 'express-validator';
import { validate, validateRequest, sanitizeRequest } from '../validation';

// Mock express-validator
jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      query: {},
      params: {}
    };
    mockResponse = {};
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate (Joi)', () => {
    it('should pass validation with valid data', () => {
      const schema = Joi.object({
        username: Joi.string().required(),
        email: Joi.string().email().required()
      });

      mockRequest.body = {
        username: 'testuser',

        email: 'test@example.com'
      };

      const middleware = validate(schema, 'body');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.body).toEqual({
        username: 'testuser',
        email: 'test@example.com'
      });
    });

    it('should fail validation with invalid data', () => {
      const schema = Joi.object({
        username: Joi.string().required(),
        email: Joi.string().email().required()
      });

      mockRequest.body = {
        username: 'testuser',
        email: 'invalid-email'
      };

      const middleware = validate(schema, 'body');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation failed',
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'email'
            })
          ])
        })
      );
    });

    it('should strip unknown fields', () => {
      const schema = Joi.object({
        username: Joi.string().required()
      });

      mockRequest.body = {
        username: 'testuser',
        unknownField: 'should be removed'
      };

      const middleware = validate(schema, 'body');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.body).toEqual({
        username: 'testuser'
      });
    });

    it('should validate query parameters', () => {
      const schema = Joi.object({
        page: Joi.number().integer().min(1),
        limit: Joi.number().integer().min(1).max(100)
      });

      mockRequest.query = {
        page: '1',
        limit: '20'
      };

      const middleware = validate(schema, 'query');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should validate route parameters', () => {
      const schema = Joi.object({
        id: Joi.number().integer().required()
      });

      mockRequest.params = {
        id: '123'
      };

      const middleware = validate(schema, 'params');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should return all validation errors', () => {
      const schema = Joi.object({
        username: Joi.string().required(),
        email: Joi.string().email().required(),
        age: Joi.number().integer().min(18).required()
      });

      mockRequest.body = {
        username: '',
        email: 'invalid',
        age: 15
      };

      const middleware = validate(schema, 'body');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.objectContaining({ field: 'username' }),
            expect.objectContaining({ field: 'email' }),
            expect.objectContaining({ field: 'age' })
          ])
        })
      );
    });
  });

  describe('validateRequest (express-validator)', () => {
    it('should pass validation when no errors', async () => {
      const mockValidation = {
        run: jest.fn<(req: any) => Promise<void>>().mockResolvedValue(undefined)
      };

      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => true,
        array: () => []
      });

      const middleware = validateRequest([mockValidation as any]);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockValidation.run).toHaveBeenCalledWith(mockRequest);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should fail validation with errors', async () => {
      const mockValidation = {
        run: jest.fn<(req: any) => Promise<void>>().mockResolvedValue(undefined)
      };

      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => [
          {
            type: 'field',
            path: 'email',
            msg: 'Invalid email format'
          }
        ]
      });

      const middleware = validateRequest([mockValidation as any]);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation failed',
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'email',
              message: 'Invalid email format'
            })
          ])
        })
      );
    });

    it('should handle multiple validation chains', async () => {
      const mockValidation1 = {
        run: jest.fn<(req: any) => Promise<void>>().mockResolvedValue(undefined)
      };
      const mockValidation2 = {
        run: jest.fn<(req: any) => Promise<void>>().mockResolvedValue(undefined)
      };

      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => true,
        array: () => []
      });

      const middleware = validateRequest([mockValidation1 as any, mockValidation2 as any]);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockValidation1.run).toHaveBeenCalledWith(mockRequest);
      expect(mockValidation2.run).toHaveBeenCalledWith(mockRequest);
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('sanitizeRequest', () => {
    it('should sanitize body data', () => {
      mockRequest.body = {
        name: '  John Doe  ',
        description: 'Test\0Description'
      };

      sanitizeRequest(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.body).toEqual({
        name: 'John Doe',
        description: 'TestDescription'
      });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should sanitize query parameters', () => {
      mockRequest.query = {
        search: '  test query  ',
        filter: 'value\0'
      };

      sanitizeRequest(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.query).toEqual({
        search: 'test query',
        filter: 'value'
      });
    });

    it('should sanitize route parameters', () => {
      mockRequest.params = {
        id: '  123  ',
        slug: 'test\0slug'
      };

      sanitizeRequest(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.params).toEqual({
        id: '123',
        slug: 'testslug'
      });
    });

    it('should handle nested objects', () => {
      mockRequest.body = {
        user: {
          name: '  John  ',
          address: {
            street: '  Main St  ',
            city: 'New\0York'
          }
        }
      };

      sanitizeRequest(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.body).toEqual({
        user: {
          name: 'John',
          address: {
            street: 'Main St',
            city: 'NewYork'
          }
        }
      });
    });

    it('should handle arrays', () => {
      mockRequest.body = {
        tags: ['  tag1  ', 'tag2\0', '  tag3  ']
      };

      sanitizeRequest(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.body).toEqual({
        tags: ['tag1', 'tag2', 'tag3']
      });
    });

    it('should preserve non-string values', () => {
      mockRequest.body = {
        name: '  John  ',
        age: 25,
        active: true,
        score: 95.5,
        metadata: null
      };

      sanitizeRequest(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.body).toEqual({
        name: 'John',
        age: 25,
        active: true,
        score: 95.5,
        metadata: null
      });
    });

    it('should handle empty objects', () => {
      mockRequest.body = {};
      mockRequest.query = {};
      mockRequest.params = {};

      sanitizeRequest(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.body).toEqual({});
      expect(mockRequest.query).toEqual({});
      expect(mockRequest.params).toEqual({});
      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});


describe('XSS Protection', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      query: {},
      params: {}
    };
    mockResponse = {};
    mockNext = jest.fn();
  });

  describe('sanitizeRequest with XSS prevention', () => {
    it('should remove script tags from input', () => {
      mockRequest.body = {
        name: 'John<script>alert("xss")</script>Doe',
        description: '<img src=x onerror=alert("xss")>'
      };

      sanitizeRequest(mockRequest as Request, mockResponse as Response, mockNext);

      // XSS library removes tags but keeps text content
      expect(mockRequest.body.name).not.toContain('<script>');
      expect(mockRequest.body.name).not.toContain('</script>');
      expect(mockRequest.body.description).not.toContain('<img');
      expect(mockRequest.body.description).not.toContain('onerror');
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should remove javascript: protocol from input', () => {
      mockRequest.body = {
        link: '<a href="javascript:alert(\'xss\')">Click</a>',
        url: '<script>javascript:void(0)</script>'
      };

      sanitizeRequest(mockRequest as Request, mockResponse as Response, mockNext);

      // Tags should be removed
      expect(mockRequest.body.link).not.toContain('<a');
      expect(mockRequest.body.link).not.toContain('href');
      expect(mockRequest.body.url).not.toContain('<script>');
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should remove event handlers from input', () => {
      mockRequest.body = {
        text: '<div onclick="alert(\'xss\')">Click me</div>',
        html: '<a href="#" onmouseover="alert(\'xss\')">Hover</a>'
      };

      sanitizeRequest(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.body.text).not.toContain('onclick');
      expect(mockRequest.body.html).not.toContain('onmouseover');
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle nested XSS attempts', () => {
      mockRequest.body = {
        user: {
          name: '<script>alert("xss")</script>',
          bio: '<img src=x onerror=alert("xss")>',
          comments: [
            '<script>alert("xss1")</script>',
            '<img src=x onerror=alert("xss2")>'
          ]
        }
      };

      sanitizeRequest(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.body.user.name).not.toContain('<script>');
      expect(mockRequest.body.user.bio).not.toContain('<img');
      expect(mockRequest.body.user.comments[0]).not.toContain('<script>');
      expect(mockRequest.body.user.comments[1]).not.toContain('<img');
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should preserve safe text content', () => {
      mockRequest.body = {
        name: 'John Doe',
        description: 'This is a safe description with numbers 123 and symbols !@#'
      };

      sanitizeRequest(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.body.name).toBe('John Doe');
      expect(mockRequest.body.description).toContain('safe description');
      expect(mockRequest.body.description).toContain('123');
      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});

describe('SQL Injection Protection', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      query: {},
      params: {}
    };
    mockResponse = {};
    mockNext = jest.fn();
  });

  describe('sqlInjectionProtection middleware', () => {
    let sqlInjectionProtection: any;

    beforeEach(async () => {
      // Dynamically import to get the middleware
      const module = await import('../validation');
      sqlInjectionProtection = module.sqlInjectionProtection;
    });

    it('should detect SQL injection in body', () => {
      mockRequest.body = {
        username: "admin' OR '1'='1",
        password: 'password'
      };

      sqlInjectionProtection(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Suspicious input detected'
        })
      );
    });

    it('should detect UNION-based SQL injection', () => {
      mockRequest.body = {
        search: "' UNION SELECT * FROM users--"
      };

      sqlInjectionProtection(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Suspicious input detected'
        })
      );
    });

    it('should detect DROP TABLE attempts', () => {
      mockRequest.body = {
        name: "'; DROP TABLE students;--"
      };

      sqlInjectionProtection(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Suspicious input detected'
        })
      );
    });

    it('should allow safe input', () => {
      mockRequest.body = {
        username: 'john_doe',
        email: 'john@example.com',
        description: 'This is a safe description'
      };

      sqlInjectionProtection(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should detect SQL injection in query parameters', () => {
      mockRequest.query = {
        filter: "1' OR '1'='1"
      };

      sqlInjectionProtection(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Suspicious input detected'
        })
      );
    });

    it('should detect SQL injection in nested objects', () => {
      mockRequest.body = {
        user: {
          profile: {
            bio: "'; DELETE FROM users WHERE '1'='1"
          }
        }
      };

      sqlInjectionProtection(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Suspicious input detected'
        })
      );
    });
  });
});

describe('CSRF Protection', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      query: {},
      params: {},
      cookies: {},
      headers: {},
      method: 'GET'
    };
    mockResponse = {
      cookie: jest.fn() as any,
      locals: {}
    };
    mockNext = jest.fn();
  });

  describe('csrfProtection middleware', () => {
    let csrfProtection: any;
    let setCsrfToken: any;

    beforeEach(async () => {
      const module = await import('../validation');
      csrfProtection = module.csrfProtection;
      setCsrfToken = module.setCsrfToken;
    });

    it('should skip CSRF check for GET requests', () => {
      mockRequest.method = 'GET';

      csrfProtection(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should skip CSRF check for HEAD requests', () => {
      mockRequest.method = 'HEAD';

      csrfProtection(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should skip CSRF check for OPTIONS requests', () => {
      mockRequest.method = 'OPTIONS';

      csrfProtection(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should fail when CSRF token is missing', () => {
      mockRequest.method = 'POST';
      mockRequest.cookies = {};
      mockRequest.headers = {};
      mockRequest.body = {};

      csrfProtection(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'CSRF token missing'
        })
      );
    });

    it('should fail when tokens do not match', () => {
      mockRequest.method = 'POST';
      mockRequest.cookies = { 'csrf-token': 'token123' };
      mockRequest.headers = { 'x-csrf-token': 'token456' };

      csrfProtection(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'CSRF token invalid'
        })
      );
    });

    it('should pass when tokens match (header)', () => {
      mockRequest.method = 'POST';
      mockRequest.cookies = { 'csrf-token': 'token123' };
      mockRequest.headers = { 'x-csrf-token': 'token123' };

      csrfProtection(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should pass when tokens match (body)', () => {
      mockRequest.method = 'POST';
      mockRequest.cookies = { 'csrf-token': 'token123' };
      mockRequest.body = { csrfToken: 'token123' };

      csrfProtection(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should set CSRF token cookie when not present', () => {
      mockRequest.cookies = {};

      setCsrfToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'csrf-token',
        expect.any(String),
        expect.objectContaining({
          httpOnly: false,
          sameSite: 'strict'
        })
      );
      expect(mockResponse.locals?.csrfToken).toBeDefined();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reuse existing CSRF token', () => {
      mockRequest.cookies = { 'csrf-token': 'existing-token' };

      setCsrfToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.cookie).not.toHaveBeenCalled();
      expect(mockResponse.locals?.csrfToken).toBe('existing-token');
      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});
