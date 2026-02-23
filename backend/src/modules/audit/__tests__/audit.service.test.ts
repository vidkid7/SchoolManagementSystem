import auditService from '../audit.service';
import AuditLog, { AuditAction } from '@models/AuditLog.model';
import { Op } from 'sequelize';

/**
 * Audit Service Tests
 * Requirements: 38.5, 38.7
 */

jest.mock('@models/AuditLog.model');

describe('AuditService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAuditLogs', () => {
    it('should fetch audit logs with pagination', async () => {
      const mockLogs = [
        {
          auditLogId: 1,
          userId: 1,
          entityType: 'student',
          entityId: 100,
          action: AuditAction.CREATE,
          oldValue: null,
          newValue: { name: 'Test Student' },
          changedFields: null,
          ipAddress: '127.0.0.1',
          userAgent: 'Test Agent',
          metadata: null,
          timestamp: new Date()
        }
      ];

      (AuditLog.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: mockLogs,
        count: 1
      });

      const result = await auditService.getAuditLogs({}, 1, 20);

      expect(result.logs).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
      expect(AuditLog.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: 20,
        offset: 0,
        order: [['timestamp', 'DESC']]
      });
    });

    it('should apply filters correctly', async () => {
      (AuditLog.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [],
        count: 0
      });

      await auditService.getAuditLogs({
        userId: 1,
        entityType: 'student',
        action: AuditAction.UPDATE
      }, 1, 20);

      expect(AuditLog.findAndCountAll).toHaveBeenCalledWith({
        where: {
          userId: 1,
          entityType: 'student',
          action: AuditAction.UPDATE
        },
        limit: 20,
        offset: 0,
        order: [['timestamp', 'DESC']]
      });
    });

    it('should apply date range filters', async () => {
      (AuditLog.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [],
        count: 0
      });

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      await auditService.getAuditLogs({
        startDate,
        endDate
      }, 1, 20);

      expect(AuditLog.findAndCountAll).toHaveBeenCalledWith({
        where: {
          timestamp: {
            [Op.gte]: startDate,
            [Op.lte]: endDate
          }
        },
        limit: 20,
        offset: 0,
        order: [['timestamp', 'DESC']]
      });
    });

    it('should apply search filter', async () => {
      (AuditLog.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [],
        count: 0
      });

      await auditService.getAuditLogs({
        search: 'student'
      }, 1, 20);

      expect(AuditLog.findAndCountAll).toHaveBeenCalledWith({
        where: {
          [Op.or]: [
            { entityType: { [Op.like]: '%student%' } },
            { changedFields: { [Op.like]: '%student%' } }
          ]
        },
        limit: 20,
        offset: 0,
        order: [['timestamp', 'DESC']]
      });
    });

    it('should limit page size to 100', async () => {
      (AuditLog.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [],
        count: 0
      });

      await auditService.getAuditLogs({}, 1, 200);

      expect(AuditLog.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: 100,
        offset: 0,
        order: [['timestamp', 'DESC']]
      });
    });

    it('should calculate pagination correctly', async () => {
      (AuditLog.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [],
        count: 45
      });

      const result = await auditService.getAuditLogs({}, 2, 20);

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.total).toBe(45);
      expect(result.pagination.totalPages).toBe(3);
      expect(AuditLog.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: 20,
        offset: 20,
        order: [['timestamp', 'DESC']]
      });
    });
  });

  describe('getAuditLogById', () => {
    it('should fetch audit log by ID', async () => {
      const mockLog = {
        auditLogId: 1,
        userId: 1,
        entityType: 'student',
        entityId: 100,
        action: AuditAction.CREATE,
        timestamp: new Date()
      };

      (AuditLog.findByPk as jest.Mock).mockResolvedValue(mockLog);

      const result = await auditService.getAuditLogById(1);

      expect(result).toEqual(mockLog);
      expect(AuditLog.findByPk).toHaveBeenCalledWith(1);
    });

    it('should return null if log not found', async () => {
      (AuditLog.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await auditService.getAuditLogById(999);

      expect(result).toBeNull();
    });
  });

  describe('getAuditLogStats', () => {
    it('should return audit log statistics', async () => {
      (AuditLog.count as jest.Mock)
        .mockResolvedValueOnce(100) // Total logs
        .mockResolvedValueOnce(30)  // CREATE
        .mockResolvedValueOnce(50)  // UPDATE
        .mockResolvedValueOnce(15)  // DELETE
        .mockResolvedValueOnce(5);  // RESTORE

      (AuditLog.findAll as jest.Mock).mockResolvedValue([
        { entityType: 'student', count: 60 },
        { entityType: 'staff', count: 40 }
      ]);

      (AuditLog.findOne as jest.Mock)
        .mockResolvedValueOnce({ timestamp: new Date('2024-01-01') }) // Oldest
        .mockResolvedValueOnce({ timestamp: new Date('2024-12-31') }); // Newest

      const result = await auditService.getAuditLogStats();

      expect(result.totalLogs).toBe(100);
      expect(result.logsByAction[AuditAction.CREATE]).toBe(30);
      expect(result.logsByAction[AuditAction.UPDATE]).toBe(50);
      expect(result.logsByAction[AuditAction.DELETE]).toBe(15);
      expect(result.logsByAction[AuditAction.RESTORE]).toBe(5);
      expect(result.logsByEntityType).toEqual({
        student: 60,
        staff: 40
      });
      expect(result.oldestLog).toEqual(new Date('2024-01-01'));
      expect(result.newestLog).toEqual(new Date('2024-12-31'));
    });
  });

  describe('rotateAuditLogs', () => {
    it('should delete logs older than retention period', async () => {
      const mockDate = new Date('2024-12-31');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      (AuditLog.destroy as jest.Mock).mockResolvedValue(50);

      const result = await auditService.rotateAuditLogs(365);

      expect(result.deletedCount).toBe(50);
      expect(result.executedAt).toEqual(mockDate);
      
      const expectedCutoffDate = new Date('2024-12-31');
      expectedCutoffDate.setDate(expectedCutoffDate.getDate() - 365);
      
      expect(AuditLog.destroy).toHaveBeenCalledWith({
        where: {
          timestamp: {
            [Op.lt]: expect.any(Date)
          }
        },
        force: true
      });

      jest.restoreAllMocks();
    });

    it('should use default retention of 365 days', async () => {
      (AuditLog.destroy as jest.Mock).mockResolvedValue(10);

      const result = await auditService.rotateAuditLogs();

      expect(result.deletedCount).toBe(10);
      expect(AuditLog.destroy).toHaveBeenCalled();
    });
  });

  describe('exportAuditLogs', () => {
    it('should export audit logs with filters', async () => {
      const mockLogs = [
        { auditLogId: 1, entityType: 'student' },
        { auditLogId: 2, entityType: 'student' }
      ];

      (AuditLog.findAll as jest.Mock).mockResolvedValue(mockLogs);

      const result = await auditService.exportAuditLogs({
        entityType: 'student'
      });

      expect(result).toEqual(mockLogs);
      expect(AuditLog.findAll).toHaveBeenCalledWith({
        where: {
          entityType: 'student'
        },
        order: [['timestamp', 'DESC']],
        limit: 10000
      });
    });

    it('should limit export to 10000 records', async () => {
      (AuditLog.findAll as jest.Mock).mockResolvedValue([]);

      await auditService.exportAuditLogs({});

      expect(AuditLog.findAll).toHaveBeenCalledWith({
        where: {},
        order: [['timestamp', 'DESC']],
        limit: 10000
      });
    });
  });

  describe('getEntityAuditLogs', () => {
    it('should fetch logs for specific entity', async () => {
      (AuditLog.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [],
        count: 0
      });

      await auditService.getEntityAuditLogs('student', 100, 1, 20);

      expect(AuditLog.findAndCountAll).toHaveBeenCalledWith({
        where: {
          entityType: 'student',
          entityId: 100
        },
        limit: 20,
        offset: 0,
        order: [['timestamp', 'DESC']]
      });
    });
  });

  describe('getUserAuditLogs', () => {
    it('should fetch logs for specific user', async () => {
      (AuditLog.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [],
        count: 0
      });

      await auditService.getUserAuditLogs(1, 1, 20);

      expect(AuditLog.findAndCountAll).toHaveBeenCalledWith({
        where: {
          userId: 1
        },
        limit: 20,
        offset: 0,
        order: [['timestamp', 'DESC']]
      });
    });
  });
});
