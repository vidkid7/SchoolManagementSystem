import auditLogger from '../auditLogger';
import AuditLog, { AuditAction } from '@models/AuditLog.model';
import { Request } from 'express';

// Mock the AuditLog model
jest.mock('@models/AuditLog.model');

// Mock logger
jest.mock('../logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

describe('AuditLogger Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logCreate', () => {
    it('should log a create operation with all details', async () => {
      const mockAuditLog = {
        auditLogId: 1,
        userId: 123,
        entityType: 'student',
        entityId: 456,
        action: AuditAction.CREATE,
        newValue: { name: 'John Doe', email: 'john@example.com' },
        oldValue: null,
        changedFields: null,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date()
      };

      (AuditLog.create as jest.Mock).mockResolvedValue(mockAuditLog);

      const mockReq = {
        ip: '192.168.1.1',
        socket: { remoteAddress: '192.168.1.1' },
        get: jest.fn((header: string) => {
          if (header === 'user-agent') return 'Mozilla/5.0';
          return null;
        })
      } as unknown as Request;

      const result = await auditLogger.logCreate(
        'student',
        456,
        { name: 'John Doe', email: 'john@example.com' },
        123,
        mockReq
      );

      expect(AuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 123,
          entityType: 'student',
          entityId: 456,
          action: AuditAction.CREATE,
          newValue: { name: 'John Doe', email: 'john@example.com' },
          oldValue: null,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0'
        })
      );

      expect(result).toEqual(mockAuditLog);
    });

    it('should handle create operation without request object', async () => {
      const mockAuditLog = {
        auditLogId: 1,
        userId: 123,
        entityType: 'student',
        entityId: 456,
        action: AuditAction.CREATE,
        newValue: { name: 'John Doe' },
        ipAddress: null,
        userAgent: null
      };

      (AuditLog.create as jest.Mock).mockResolvedValue(mockAuditLog);

      await auditLogger.logCreate(
        'student',
        456,
        { name: 'John Doe' },
        123
      );

      expect(AuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: null,
          userAgent: null
        })
      );
    });
  });

  describe('logUpdate', () => {
    it('should log an update operation with changed fields', async () => {
      const oldValue = { 
        name: 'John Doe', 
        email: 'john@example.com',
        updatedAt: new Date('2024-01-01')
      };
      const newValue = { 
        name: 'John Smith', 
        email: 'john@example.com',
        updatedAt: new Date('2024-01-02')
      };

      const mockAuditLog = {
        auditLogId: 1,
        userId: 123,
        entityType: 'student',
        entityId: 456,
        action: AuditAction.UPDATE,
        oldValue,
        newValue,
        changedFields: ['name'], // updatedAt should be excluded
        timestamp: new Date()
      };

      (AuditLog.create as jest.Mock).mockResolvedValue(mockAuditLog);

      const result = await auditLogger.logUpdate(
        'student',
        456,
        oldValue,
        newValue,
        123
      );

      expect(AuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.UPDATE,
          oldValue,
          newValue,
          changedFields: expect.arrayContaining(['name'])
        })
      );

      expect(result.changedFields).not.toContain('updatedAt');
      expect(result.changedFields).not.toContain('updated_at');
    });

    it('should detect multiple changed fields', async () => {
      const oldValue = { 
        name: 'John Doe', 
        email: 'john@example.com',
        phone: '1234567890'
      };
      const newValue = { 
        name: 'John Smith', 
        email: 'john.smith@example.com',
        phone: '1234567890'
      };

      (AuditLog.create as jest.Mock).mockResolvedValue({
        changedFields: ['name', 'email']
      });

      await auditLogger.logUpdate('student', 456, oldValue, newValue, 123);

      expect(AuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          changedFields: expect.arrayContaining(['name', 'email'])
        })
      );
    });
  });

  describe('logDelete', () => {
    it('should log a delete operation', async () => {
      const oldValue = { name: 'John Doe', email: 'john@example.com' };

      const mockAuditLog = {
        auditLogId: 1,
        userId: 123,
        entityType: 'student',
        entityId: 456,
        action: AuditAction.DELETE,
        oldValue,
        newValue: null,
        timestamp: new Date()
      };

      (AuditLog.create as jest.Mock).mockResolvedValue(mockAuditLog);

      const result = await auditLogger.logDelete(
        'student',
        456,
        oldValue,
        123
      );

      expect(AuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.DELETE,
          oldValue,
          newValue: null
        })
      );

      expect(result).toEqual(mockAuditLog);
    });
  });

  describe('logRestore', () => {
    it('should log a restore operation', async () => {
      const newValue = { name: 'John Doe', email: 'john@example.com' };

      const mockAuditLog = {
        auditLogId: 1,
        userId: 123,
        entityType: 'student',
        entityId: 456,
        action: AuditAction.RESTORE,
        oldValue: null,
        newValue,
        timestamp: new Date()
      };

      (AuditLog.create as jest.Mock).mockResolvedValue(mockAuditLog);

      const result = await auditLogger.logRestore(
        'student',
        456,
        newValue,
        123
      );

      expect(AuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.RESTORE,
          oldValue: null,
          newValue
        })
      );

      expect(result).toEqual(mockAuditLog);
    });
  });

  describe('getEntityAuditLogs', () => {
    it('should retrieve audit logs for a specific entity', async () => {
      const mockLogs = [
        { auditLogId: 1, entityType: 'student', entityId: 456 },
        { auditLogId: 2, entityType: 'student', entityId: 456 }
      ];

      (AuditLog.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: mockLogs,
        count: 2
      });

      const result = await auditLogger.getEntityAuditLogs('student', 456);

      expect(AuditLog.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { entityType: 'student', entityId: 456 },
          order: [['timestamp', 'DESC']]
        })
      );

      expect(result.logs).toEqual(mockLogs);
      expect(result.total).toBe(2);
    });

    it('should filter by action type', async () => {
      (AuditLog.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [],
        count: 0
      });

      await auditLogger.getEntityAuditLogs('student', 456, {
        action: AuditAction.UPDATE
      });

      expect(AuditLog.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { 
            entityType: 'student', 
            entityId: 456,
            action: AuditAction.UPDATE
          }
        })
      );
    });

    it('should respect pagination limits', async () => {
      (AuditLog.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [],
        count: 0
      });

      await auditLogger.getEntityAuditLogs('student', 456, {
        limit: 10,
        offset: 20
      });

      expect(AuditLog.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 20
        })
      );
    });

    it('should enforce maximum limit of 100', async () => {
      (AuditLog.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [],
        count: 0
      });

      await auditLogger.getEntityAuditLogs('student', 456, {
        limit: 200 // Should be capped at 100
      });

      expect(AuditLog.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 100
        })
      );
    });
  });

  describe('getUserAuditLogs', () => {
    it('should retrieve audit logs for a specific user', async () => {
      const mockLogs = [
        { auditLogId: 1, userId: 123 },
        { auditLogId: 2, userId: 123 }
      ];

      (AuditLog.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: mockLogs,
        count: 2
      });

      const result = await auditLogger.getUserAuditLogs(123);

      expect(AuditLog.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 123 },
          order: [['timestamp', 'DESC']]
        })
      );

      expect(result.logs).toEqual(mockLogs);
      expect(result.total).toBe(2);
    });

    it('should filter by entity type and action', async () => {
      (AuditLog.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [],
        count: 0
      });

      await auditLogger.getUserAuditLogs(123, {
        entityType: 'student',
        action: AuditAction.UPDATE
      });

      expect(AuditLog.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { 
            userId: 123,
            entityType: 'student',
            action: AuditAction.UPDATE
          }
        })
      );
    });
  });

  describe('cleanupOldLogs', () => {
    it('should delete logs older than 1 year', async () => {
      (AuditLog.destroy as jest.Mock).mockResolvedValue(150);

      const result = await auditLogger.cleanupOldLogs();

      expect(AuditLog.destroy).toHaveBeenCalledWith(
        expect.objectContaining({
          force: true,
          where: expect.objectContaining({
            timestamp: expect.anything()
          })
        })
      );

      expect(result).toBe(150);
    });
  });

  describe('IP address extraction', () => {
    it('should extract IP from x-forwarded-for header', async () => {
      const mockReq = {
        get: jest.fn((header: string) => {
          if (header === 'x-forwarded-for') return '203.0.113.1, 198.51.100.1';
          if (header === 'user-agent') return 'Mozilla/5.0';
          return null;
        }),
        ip: '192.168.1.1'
      } as unknown as Request;

      (AuditLog.create as jest.Mock).mockResolvedValue({});

      await auditLogger.logCreate('student', 1, {}, 123, mockReq);

      expect(AuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: '203.0.113.1' // First IP from x-forwarded-for
        })
      );
    });

    it('should extract IP from x-real-ip header', async () => {
      const mockReq = {
        get: jest.fn((header: string) => {
          if (header === 'x-real-ip') return '203.0.113.1';
          if (header === 'user-agent') return 'Mozilla/5.0';
          return null;
        }),
        ip: '192.168.1.1'
      } as unknown as Request;

      (AuditLog.create as jest.Mock).mockResolvedValue({});

      await auditLogger.logCreate('student', 1, {}, 123, mockReq);

      expect(AuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: '203.0.113.1'
        })
      );
    });

    it('should fall back to req.ip', async () => {
      const mockReq = {
        get: jest.fn().mockReturnValue(null),
        ip: '192.168.1.1'
      } as unknown as Request;

      (AuditLog.create as jest.Mock).mockResolvedValue({});

      await auditLogger.logCreate('student', 1, {}, 123, mockReq);

      expect(AuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: '192.168.1.1'
        })
      );
    });
  });

  describe('Value comparison', () => {
    it('should detect changes in primitive values', async () => {
      const oldValue = { name: 'John', age: 25 };
      const newValue = { name: 'John', age: 26 };

      (AuditLog.create as jest.Mock).mockResolvedValue({
        changedFields: ['age']
      });

      await auditLogger.logUpdate('student', 1, oldValue, newValue, 123);

      expect(AuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          changedFields: ['age']
        })
      );
    });

    it('should detect changes in date values', async () => {
      const oldValue = { date: new Date('2024-01-01') };
      const newValue = { date: new Date('2024-01-02') };

      (AuditLog.create as jest.Mock).mockResolvedValue({
        changedFields: ['date']
      });

      await auditLogger.logUpdate('student', 1, oldValue, newValue, 123);

      expect(AuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          changedFields: ['date']
        })
      );
    });

    it('should detect changes in object values', async () => {
      const oldValue = { address: { city: 'Kathmandu', ward: 1 } };
      const newValue = { address: { city: 'Pokhara', ward: 1 } };

      (AuditLog.create as jest.Mock).mockResolvedValue({
        changedFields: ['address']
      });

      await auditLogger.logUpdate('student', 1, oldValue, newValue, 123);

      expect(AuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          changedFields: ['address']
        })
      );
    });

    it('should handle null and undefined values', async () => {
      const oldValue = { email: null, phone: undefined };
      const newValue = { email: 'john@example.com', phone: '1234567890' };

      (AuditLog.create as jest.Mock).mockResolvedValue({
        changedFields: ['email', 'phone']
      });

      await auditLogger.logUpdate('student', 1, oldValue, newValue, 123);

      expect(AuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          changedFields: expect.arrayContaining(['email', 'phone'])
        })
      );
    });
  });
});
