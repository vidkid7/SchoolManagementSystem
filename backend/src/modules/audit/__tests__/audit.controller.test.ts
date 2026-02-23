import { Request, Response, NextFunction } from 'express';
import auditController from '../audit.controller';
import auditService from '../audit.service';
import { AuditAction } from '@models/AuditLog.model';

/**
 * Audit Controller Tests
 * Requirements: 38.5
 */

jest.mock('../audit.service');

describe('AuditController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      query: {},
      params: {},
      body: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('getAuditLogs', () => {
    it('should return audit logs with pagination', async () => {
      const mockResult = {
        logs: [
          {
            auditLogId: 1,
            userId: 1,
            entityType: 'student',
            entityId: 100,
            action: AuditAction.CREATE,
            oldValue: null,
            newValue: { name: 'Test' },
            changedFields: null,
            ipAddress: '127.0.0.1',
            userAgent: 'Test',
            metadata: null,
            timestamp: new Date()
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1
        }
      };

      (auditService.getAuditLogs as jest.Mock).mockResolvedValue(mockResult);

      mockRequest.query = { page: '1', limit: '20' };

      await auditController.getAuditLogs(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(auditService.getAuditLogs).toHaveBeenCalledWith(
        {},
        1,
        20,
        'timestamp',
        'DESC'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult.logs,
        pagination: mockResult.pagination
      });
    });

    it('should apply filters from query params', async () => {
      const mockResult = {
        logs: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      };

      (auditService.getAuditLogs as jest.Mock).mockResolvedValue(mockResult);

      mockRequest.query = {
        userId: '1',
        entityType: 'student',
        action: 'create',
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-12-31T23:59:59.999Z'
      };

      await auditController.getAuditLogs(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(auditService.getAuditLogs).toHaveBeenCalledWith(
        {
          userId: 1,
          entityType: 'student',
          action: 'create',
          startDate: new Date('2024-01-01T00:00:00.000Z'),
          endDate: new Date('2024-12-31T23:59:59.999Z')
        },
        1,
        20,
        'timestamp',
        'DESC'
      );
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      (auditService.getAuditLogs as jest.Mock).mockRejectedValue(error);

      await auditController.getAuditLogs(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getAuditLogById', () => {
    it('should return audit log by ID', async () => {
      const mockLog = {
        auditLogId: 1,
        userId: 1,
        entityType: 'student',
        entityId: 100,
        action: AuditAction.CREATE,
        timestamp: new Date()
      };

      (auditService.getAuditLogById as jest.Mock).mockResolvedValue(mockLog);

      mockRequest.params = { id: '1' };

      await auditController.getAuditLogById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(auditService.getAuditLogById).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockLog
      });
    });

    it('should return 404 if log not found', async () => {
      (auditService.getAuditLogById as jest.Mock).mockResolvedValue(null);

      mockRequest.params = { id: '999' };

      await auditController.getAuditLogById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUDIT_LOG_NOT_FOUND',
          message: 'Audit log not found'
        }
      });
    });
  });

  describe('getEntityAuditLogs', () => {
    it('should return logs for specific entity', async () => {
      const mockResult = {
        logs: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      };

      (auditService.getEntityAuditLogs as jest.Mock).mockResolvedValue(mockResult);

      mockRequest.params = { entityType: 'student', entityId: '100' };
      mockRequest.query = { page: '1', limit: '20' };

      await auditController.getEntityAuditLogs(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(auditService.getEntityAuditLogs).toHaveBeenCalledWith(
        'student',
        100,
        1,
        20
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getUserAuditLogs', () => {
    it('should return logs for specific user', async () => {
      const mockResult = {
        logs: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      };

      (auditService.getUserAuditLogs as jest.Mock).mockResolvedValue(mockResult);

      mockRequest.params = { userId: '1' };
      mockRequest.query = { page: '1', limit: '20' };

      await auditController.getUserAuditLogs(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(auditService.getUserAuditLogs).toHaveBeenCalledWith(1, 1, 20);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getAuditLogStats', () => {
    it('should return audit log statistics', async () => {
      const mockStats = {
        totalLogs: 100,
        logsByAction: {
          [AuditAction.CREATE]: 30,
          [AuditAction.UPDATE]: 50,
          [AuditAction.DELETE]: 15,
          [AuditAction.RESTORE]: 5
        },
        logsByEntityType: {
          student: 60,
          staff: 40
        },
        oldestLog: new Date('2024-01-01'),
        newestLog: new Date('2024-12-31')
      };

      (auditService.getAuditLogStats as jest.Mock).mockResolvedValue(mockStats);

      await auditController.getAuditLogStats(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats
      });
    });
  });

  describe('rotateAuditLogs', () => {
    it('should rotate audit logs with default retention', async () => {
      const mockStats = {
        deletedCount: 50,
        cutoffDate: new Date('2023-12-31'),
        executedAt: new Date('2024-12-31')
      };

      (auditService.rotateAuditLogs as jest.Mock).mockResolvedValue(mockStats);

      mockRequest.body = {};

      await auditController.rotateAuditLogs(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(auditService.rotateAuditLogs).toHaveBeenCalledWith(365);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Audit logs rotated successfully',
        data: mockStats
      });
    });

    it('should rotate audit logs with custom retention', async () => {
      const mockStats = {
        deletedCount: 100,
        cutoffDate: new Date('2023-01-01'),
        executedAt: new Date('2024-12-31')
      };

      (auditService.rotateAuditLogs as jest.Mock).mockResolvedValue(mockStats);

      mockRequest.body = { retentionDays: 730 };

      await auditController.rotateAuditLogs(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(auditService.rotateAuditLogs).toHaveBeenCalledWith(730);
    });
  });

  describe('exportAuditLogs', () => {
    it('should export audit logs', async () => {
      const mockLogs = [
        { auditLogId: 1, entityType: 'student' },
        { auditLogId: 2, entityType: 'staff' }
      ];

      (auditService.exportAuditLogs as jest.Mock).mockResolvedValue(mockLogs);

      mockRequest.query = { entityType: 'student' };

      await auditController.exportAuditLogs(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(auditService.exportAuditLogs).toHaveBeenCalledWith({
        entityType: 'student'
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockLogs,
        count: 2
      });
    });
  });
});
