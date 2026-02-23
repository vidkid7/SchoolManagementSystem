import { Request, Response, NextFunction } from 'express';
import { auditMiddleware } from '../auditMiddleware';
import auditLogger from '@utils/auditLogger';
import { logger } from '@utils/logger';

jest.mock('@utils/auditLogger');
jest.mock('@utils/logger');

describe('Audit Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      method: 'POST',
      path: '/api/v1/students',
      body: { name: 'Test Student' },
      params: { id: '123' },
      user: { userId: 1 },
      get: jest.fn(),
      ip: '127.0.0.1'
    };

    mockResponse = {
      statusCode: 200,
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      on: jest.fn((event, callback) => {
        if (event === 'finish') {
          // Simulate response finish
          setTimeout(callback, 0);
        }
        return mockResponse as Response;
      })
    };

    nextFunction = jest.fn();

    jest.clearAllMocks();
  });

  describe('Request Filtering', () => {
    it('should skip GET requests', () => {
      mockRequest.method = 'GET';

      auditMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(auditLogger.log).not.toHaveBeenCalled();
    });

    it('should skip non-API routes', () => {
      mockRequest.path = '/health';

      auditMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should skip health check routes', () => {
      mockRequest.path = '/api/v1/health';

      auditMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should process POST requests', async () => {
      mockRequest.method = 'POST';
      mockRequest.path = '/api/v1/students';

      auditMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should process PUT requests', async () => {
      mockRequest.method = 'PUT';
      mockRequest.path = '/api/v1/students/123';

      auditMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should process DELETE requests', async () => {
      mockRequest.method = 'DELETE';
      mockRequest.path = '/api/v1/students/123';

      auditMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('Administrative Actions', () => {
    it('should log config changes as administrative actions', (done) => {
      mockRequest.method = 'PUT';
      mockRequest.path = '/api/v1/config/system-settings';
      mockRequest.body = { schoolName: 'New School Name' };

      auditMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      setTimeout(() => {
        expect(auditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 1,
            entityType: 'system_setting',
            action: 'update',
            metadata: expect.objectContaining({
              category: 'administrative_action'
            })
          })
        );
        done();
      }, 10);
    });

    it('should log role changes as administrative actions', (done) => {
      mockRequest.method = 'PUT';
      mockRequest.path = '/api/v1/config/roles/1';
      mockRequest.body = { name: 'Updated Role' };

      auditMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      setTimeout(() => {
        expect(auditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 1,
            action: 'update',
            metadata: expect.objectContaining({
              category: 'administrative_action'
            })
          })
        );
        done();
      }, 10);
    });

    it('should log user registration as administrative action', (done) => {
      mockRequest.method = 'POST';
      mockRequest.path = '/api/v1/auth/register';
      mockRequest.body = { username: 'newuser', email: 'new@example.com' };

      auditMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      setTimeout(() => {
        expect(auditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'create',
            metadata: expect.objectContaining({
              category: 'administrative_action'
            })
          })
        );
        done();
      }, 10);
    });
  });

  describe('Financial Transactions', () => {
    it('should log payment creation as financial transaction', (done) => {
      mockRequest.method = 'POST';
      mockRequest.path = '/api/v1/finance/payments';
      mockRequest.body = { amount: 5000, invoiceId: 1 };

      auditMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      setTimeout(() => {
        expect(auditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 1,
            action: 'create',
            metadata: expect.objectContaining({
              category: 'financial_transaction'
            })
          })
        );
        done();
      }, 10);
    });

    it('should log invoice updates as financial transaction', (done) => {
      mockRequest.method = 'PUT';
      mockRequest.path = '/api/v1/finance/invoices/1';
      mockRequest.body = { discount: 500 };

      auditMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      setTimeout(() => {
        expect(auditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'update',
            metadata: expect.objectContaining({
              category: 'financial_transaction'
            })
          })
        );
        done();
      }, 10);
    });

    it('should log payment gateway transactions', (done) => {
      mockRequest.method = 'POST';
      mockRequest.path = '/api/v1/payment-gateway/esewa/initiate';
      mockRequest.body = { amount: 10000 };

      auditMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      setTimeout(() => {
        expect(auditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            metadata: expect.objectContaining({
              category: 'financial_transaction'
            })
          })
        );
        done();
      }, 10);
    });
  });

  describe('Data Modifications', () => {
    it('should log student creation', (done) => {
      mockRequest.method = 'POST';
      mockRequest.path = '/api/v1/students';
      mockRequest.params = {};
      mockRequest.auditEntityId = 123;

      auditMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      setTimeout(() => {
        expect(auditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 1,
            entityType: 'student',
            entityId: 123,
            action: 'create'
          })
        );
        done();
      }, 10);
    });

    it('should log staff updates', (done) => {
      mockRequest.method = 'PUT';
      mockRequest.path = '/api/v1/staff/456';
      mockRequest.params = { id: '456' };

      auditMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      setTimeout(() => {
        expect(auditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 1,
            entityType: 'staff',
            entityId: 456,
            action: 'update'
          })
        );
        done();
      }, 10);
    });

    it('should log exam deletions', (done) => {
      mockRequest.method = 'DELETE';
      mockRequest.path = '/api/v1/exams/789';
      mockRequest.params = { id: '789' };

      auditMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      setTimeout(() => {
        expect(auditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 1,
            entityType: 'exam',
            entityId: 789,
            action: 'delete'
          })
        );
        done();
      }, 10);
    });
  });

  describe('Error Handling', () => {
    it('should not log failed requests (4xx status)', (done) => {
      mockResponse.statusCode = 400;

      auditMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      setTimeout(() => {
        expect(auditLogger.log).not.toHaveBeenCalled();
        done();
      }, 10);
    });

    it('should not log server errors (5xx status)', (done) => {
      mockResponse.statusCode = 500;

      auditMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      setTimeout(() => {
        expect(auditLogger.log).not.toHaveBeenCalled();
        done();
      }, 10);
    });

    it('should not fail request if audit logging fails', (done) => {
      (auditLogger.log as jest.Mock).mockRejectedValue(new Error('Audit error'));

      mockRequest.method = 'POST';
      mockRequest.path = '/api/v1/students';
      mockRequest.auditEntityId = 123;

      auditMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      setTimeout(() => {
        expect(logger.error).toHaveBeenCalledWith(
          'Error in audit middleware',
          expect.any(Object)
        );
        done();
      }, 10);
    });
  });

  describe('IP Address Extraction', () => {
    it('should extract IP from x-forwarded-for header', (done) => {
      (mockRequest.get as jest.Mock).mockImplementation((header: string) => {
        if (header === 'x-forwarded-for') return '192.168.1.1, 10.0.0.1';
        return undefined;
      });

      mockRequest.path = '/api/v1/config/system-settings';
      mockRequest.method = 'PUT';

      auditMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      setTimeout(() => {
        expect(auditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            ipAddress: '192.168.1.1'
          })
        );
        done();
      }, 10);
    });

    it('should extract IP from x-real-ip header', (done) => {
      (mockRequest.get as jest.Mock).mockImplementation((header: string) => {
        if (header === 'x-real-ip') return '192.168.1.2';
        return undefined;
      });

      mockRequest.path = '/api/v1/config/system-settings';
      mockRequest.method = 'PUT';

      auditMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      setTimeout(() => {
        expect(auditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            ipAddress: '192.168.1.2'
          })
        );
        done();
      }, 10);
    });

    it('should fall back to req.ip', (done) => {
      mockRequest.ip = '127.0.0.1';
      mockRequest.path = '/api/v1/config/system-settings';
      mockRequest.method = 'PUT';

      auditMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      setTimeout(() => {
        expect(auditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            ipAddress: '127.0.0.1'
          })
        );
        done();
      }, 10);
    });
  });

  describe('User Agent Tracking', () => {
    it('should capture user agent from request', (done) => {
      (mockRequest.get as jest.Mock).mockImplementation((header: string) => {
        if (header === 'user-agent') return 'Mozilla/5.0 Test Browser';
        return undefined;
      });

      mockRequest.path = '/api/v1/config/system-settings';
      mockRequest.method = 'PUT';

      auditMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      setTimeout(() => {
        expect(auditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            userAgent: 'Mozilla/5.0 Test Browser'
          })
        );
        done();
      }, 10);
    });
  });
});
