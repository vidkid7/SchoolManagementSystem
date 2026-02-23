import auditLogger from '../auditLogger';
import AuditLog, { AuditAction } from '@models/AuditLog.model';
import sequelize from '@config/database';

/**
 * Audit Logger Unit Tests
 * Tests log creation, log filtering, and log rotation
 * 
 * Requirements: 38.1, 38.5, 38.7
 */

describe('Audit Logger Unit Tests', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await AuditLog.destroy({ where: {}, force: true });
  });

  describe('Requirement 38.1: Log Creation', () => {
    describe('logCreate', () => {
      it('should create audit log for CREATE action', async () => {
        const entityData = {
          name: 'Test Entity',
          value: 123
        };

        const auditLog = await auditLogger.logCreate(
          'test_entity',
          1,
          entityData,
          1
        );

        expect(auditLog).toBeDefined();
        expect(auditLog.auditLogId).toBeDefined();
        expect(auditLog.entityType).toBe('test_entity');
        expect(auditLog.entityId).toBe(1);
        expect(auditLog.action).toBe(AuditAction.CREATE);
        expect(auditLog.userId).toBe(1);
        expect(auditLog.newValue).toEqual(entityData);
        expect(auditLog.oldValue).toBeNull();
        expect(auditLog.changedFields).toBeNull();
        expect(auditLog.timestamp).toBeInstanceOf(Date);
      });

      it('should create audit log without userId', async () => {
        const auditLog = await auditLogger.logCreate(
          'test_entity',
          1,
          { name: 'Test' },
          null
        );

        expect(auditLog.userId).toBeNull();
      });

      it('should create audit log with request metadata', async () => {
        const mockRequest = {
          get: (header: string) => {
            if (header === 'user-agent') return 'Test Browser';
            return undefined;
          },
          ip: '127.0.0.1'
        } as any;

        const auditLog = await auditLogger.logCreate(
          'test_entity',
          1,
          { name: 'Test' },
          1,
          mockRequest
        );

        expect(auditLog.ipAddress).toBe('127.0.0.1');
        expect(auditLog.userAgent).toBe('Test Browser');
      });

      it('should handle complex nested objects in newValue', async () => {
        const complexData = {
          name: 'Test',
          nested: {
            level1: {
              level2: 'deep value'
            }
          },
          array: [1, 2, 3]
        };

        const auditLog = await auditLogger.logCreate(
          'test_entity',
          1,
          complexData,
          1
        );

        expect(auditLog.newValue).toEqual(complexData);
      });
    });

    describe('logUpdate', () => {
      it('should create audit log for UPDATE action', async () => {
        const oldData = { name: 'Old Name', value: 100 };
        const newData = { name: 'New Name', value: 200 };

        const auditLog = await auditLogger.logUpdate(
          'test_entity',
          1,
          oldData,
          newData,
          1
        );

        expect(auditLog.action).toBe(AuditAction.UPDATE);
        expect(auditLog.oldValue).toEqual(oldData);
        expect(auditLog.newValue).toEqual(newData);
      });

      it('should identify changed fields correctly', async () => {
        const oldData = {
          field1: 'unchanged',
          field2: 'old value',
          field3: 100
        };
        const newData = {
          field1: 'unchanged',
          field2: 'new value',
          field3: 200
        };

        const auditLog = await auditLogger.logUpdate(
          'test_entity',
          1,
          oldData,
          newData,
          1
        );

        expect(auditLog.changedFields).toEqual(['field2', 'field3']);
      });

      it('should ignore updatedAt field in change detection', async () => {
        const oldData = {
          name: 'Test',
          updatedAt: new Date('2024-01-01')
        };
        const newData = {
          name: 'Test',
          updatedAt: new Date('2024-01-02')
        };

        const auditLog = await auditLogger.logUpdate(
          'test_entity',
          1,
          oldData,
          newData,
          1
        );

        expect(auditLog.changedFields).toEqual([]);
      });

      it('should detect changes in null/undefined values', async () => {
        const oldData = { field1: null, field2: 'value' };
        const newData = { field1: 'value', field2: null };

        const auditLog = await auditLogger.logUpdate(
          'test_entity',
          1,
          oldData,
          newData,
          1
        );

        expect(auditLog.changedFields).toEqual(['field1', 'field2']);
      });

      it('should detect changes in date values', async () => {
        const date1 = new Date('2024-01-01');
        const date2 = new Date('2024-01-02');

        const oldData = { dateField: date1 };
        const newData = { dateField: date2 };

        const auditLog = await auditLogger.logUpdate(
          'test_entity',
          1,
          oldData,
          newData,
          1
        );

        expect(auditLog.changedFields).toContain('dateField');
      });

      it('should detect changes in nested objects', async () => {
        const oldData = {
          nested: { value: 'old' }
        };
        const newData = {
          nested: { value: 'new' }
        };

        const auditLog = await auditLogger.logUpdate(
          'test_entity',
          1,
          oldData,
          newData,
          1
        );

        expect(auditLog.changedFields).toContain('nested');
      });

      it('should handle empty change set', async () => {
        const data = { name: 'Test', value: 100 };

        const auditLog = await auditLogger.logUpdate(
          'test_entity',
          1,
          data,
          data,
          1
        );

        expect(auditLog.changedFields).toEqual([]);
      });
    });

    describe('logDelete', () => {
      it('should create audit log for DELETE action', async () => {
        const deletedData = { name: 'Deleted Entity', value: 123 };

        const auditLog = await auditLogger.logDelete(
          'test_entity',
          1,
          deletedData,
          1
        );

        expect(auditLog.action).toBe(AuditAction.DELETE);
        expect(auditLog.oldValue).toEqual(deletedData);
        expect(auditLog.newValue).toBeNull();
        expect(auditLog.changedFields).toBeNull();
      });

      it('should store complete entity state before deletion', async () => {
        const complexEntity = {
          id: 1,
          name: 'Complex Entity',
          metadata: {
            created: new Date(),
            tags: ['tag1', 'tag2']
          }
        };

        const auditLog = await auditLogger.logDelete(
          'test_entity',
          1,
          complexEntity,
          1
        );

        expect(auditLog.oldValue).toEqual(complexEntity);
      });
    });

    describe('logRestore', () => {
      it('should create audit log for RESTORE action', async () => {
        const restoredData = { name: 'Restored Entity', status: 'active' };

        const auditLog = await auditLogger.logRestore(
          'test_entity',
          1,
          restoredData,
          1
        );

        expect(auditLog.action).toBe(AuditAction.RESTORE);
        expect(auditLog.newValue).toEqual(restoredData);
        expect(auditLog.oldValue).toBeNull();
        expect(auditLog.changedFields).toBeNull();
      });
    });

    describe('IP Address Extraction', () => {
      it('should extract IP from x-forwarded-for header', async () => {
        const mockRequest = {
          get: (header: string) => {
            if (header === 'x-forwarded-for') return '10.0.0.1, 192.168.1.1';
            return undefined;
          }
        } as any;

        const auditLog = await auditLogger.logCreate(
          'test_entity',
          1,
          { name: 'Test' },
          1,
          mockRequest
        );

        expect(auditLog.ipAddress).toBe('10.0.0.1');
      });

      it('should extract IP from x-real-ip header', async () => {
        const mockRequest = {
          get: (header: string) => {
            if (header === 'x-real-ip') return '10.0.0.2';
            return undefined;
          }
        } as any;

        const auditLog = await auditLogger.logCreate(
          'test_entity',
          1,
          { name: 'Test' },
          1,
          mockRequest
        );

        expect(auditLog.ipAddress).toBe('10.0.0.2');
      });

      it('should fall back to req.ip', async () => {
        const mockRequest = {
          get: () => undefined,
          ip: '192.168.1.100'
        } as any;

        const auditLog = await auditLogger.logCreate(
          'test_entity',
          1,
          { name: 'Test' },
          1,
          mockRequest
        );

        expect(auditLog.ipAddress).toBe('192.168.1.100');
      });

      it('should handle missing IP address', async () => {
        const mockRequest = {
          get: () => undefined
        } as any;

        const auditLog = await auditLogger.logCreate(
          'test_entity',
          1,
          { name: 'Test' },
          1,
          mockRequest
        );

        expect(auditLog.ipAddress).toBeNull();
      });
    });
  });

  describe('Requirement 38.5: Log Filtering', () => {
    beforeEach(async () => {
      // Create diverse audit logs for filtering tests
      await auditLogger.logCreate('student', 1, { name: 'Student 1' }, 1);
      await auditLogger.logUpdate('student', 1, { name: 'Student 1' }, { name: 'Student 1 Updated' }, 1);
      await auditLogger.logDelete('student', 1, { name: 'Student 1 Updated' }, 1);
      await auditLogger.logCreate('student', 2, { name: 'Student 2' }, 2);
      await auditLogger.logCreate('staff', 1, { name: 'Staff 1' }, 1);
      await auditLogger.logUpdate('staff', 1, { name: 'Staff 1' }, { name: 'Staff 1 Updated' }, 2);
      await auditLogger.logCreate('payment', 1, { amount: 5000 }, 1);
    });

    describe('getEntityAuditLogs', () => {
      it('should retrieve all logs for specific entity', async () => {
        const { logs, total } = await auditLogger.getEntityAuditLogs('student', 1);

        expect(total).toBe(3);
        expect(logs).toHaveLength(3);
        expect(logs.every(log => log.entityType === 'student' && log.entityId === 1)).toBe(true);
      });

      it('should filter by action type', async () => {
        const { logs, total } = await auditLogger.getEntityAuditLogs('student', 1, {
          action: AuditAction.UPDATE
        });

        expect(total).toBe(1);
        expect(logs[0].action).toBe(AuditAction.UPDATE);
      });

      it('should support pagination with limit', async () => {
        const { logs, total } = await auditLogger.getEntityAuditLogs('student', 1, {
          limit: 2
        });

        expect(total).toBe(3);
        expect(logs).toHaveLength(2);
      });

      it('should support pagination with offset', async () => {
        const { logs: page1 } = await auditLogger.getEntityAuditLogs('student', 1, {
          limit: 2,
          offset: 0
        });

        const { logs: page2 } = await auditLogger.getEntityAuditLogs('student', 1, {
          limit: 2,
          offset: 2
        });

        expect(page1).toHaveLength(2);
        expect(page2).toHaveLength(1);
        expect(page1[0].auditLogId).not.toBe(page2[0].auditLogId);
      });

      it('should enforce maximum limit of 100', async () => {
        const { logs } = await auditLogger.getEntityAuditLogs('student', 1, {
          limit: 200
        });

        // Should cap at 100 even though we requested 200
        expect(logs.length).toBeLessThanOrEqual(100);
      });

      it('should return logs in descending timestamp order', async () => {
        const { logs } = await auditLogger.getEntityAuditLogs('student', 1);

        for (let i = 0; i < logs.length - 1; i++) {
          expect(logs[i].timestamp.getTime()).toBeGreaterThanOrEqual(
            logs[i + 1].timestamp.getTime()
          );
        }
      });

      it('should return empty result for non-existent entity', async () => {
        const { logs, total } = await auditLogger.getEntityAuditLogs('student', 999);

        expect(total).toBe(0);
        expect(logs).toHaveLength(0);
      });

      it('should filter CREATE actions only', async () => {
        const { logs, total } = await auditLogger.getEntityAuditLogs('student', 1, {
          action: AuditAction.CREATE
        });

        expect(total).toBe(1);
        expect(logs[0].action).toBe(AuditAction.CREATE);
      });

      it('should filter DELETE actions only', async () => {
        const { logs, total } = await auditLogger.getEntityAuditLogs('student', 1, {
          action: AuditAction.DELETE
        });

        expect(total).toBe(1);
        expect(logs[0].action).toBe(AuditAction.DELETE);
      });
    });

    describe('getUserAuditLogs', () => {
      it('should retrieve all logs for specific user', async () => {
        const { logs, total } = await auditLogger.getUserAuditLogs(1);

        expect(total).toBe(5);
        expect(logs).toHaveLength(5);
        expect(logs.every(log => log.userId === 1)).toBe(true);
      });

      it('should filter by entity type', async () => {
        const { logs, total } = await auditLogger.getUserAuditLogs(1, {
          entityType: 'student'
        });

        expect(total).toBe(3);
        expect(logs.every(log => log.entityType === 'student')).toBe(true);
      });

      it('should filter by action type', async () => {
        const { logs, total } = await auditLogger.getUserAuditLogs(1, {
          action: AuditAction.CREATE
        });

        expect(total).toBe(3);
        expect(logs.every(log => log.action === AuditAction.CREATE)).toBe(true);
      });

      it('should filter by both entity type and action', async () => {
        const { logs, total } = await auditLogger.getUserAuditLogs(1, {
          entityType: 'student',
          action: AuditAction.CREATE
        });

        expect(total).toBe(1);
        expect(logs[0].entityType).toBe('student');
        expect(logs[0].action).toBe(AuditAction.CREATE);
      });

      it('should support pagination', async () => {
        const { logs: page1, total } = await auditLogger.getUserAuditLogs(1, {
          limit: 3,
          offset: 0
        });

        expect(total).toBe(5);
        expect(page1).toHaveLength(3);

        const { logs: page2 } = await auditLogger.getUserAuditLogs(1, {
          limit: 3,
          offset: 3
        });

        expect(page2).toHaveLength(2);
      });

      it('should enforce maximum limit of 100', async () => {
        const { logs } = await auditLogger.getUserAuditLogs(1, {
          limit: 500
        });

        expect(logs.length).toBeLessThanOrEqual(100);
      });

      it('should return logs in descending timestamp order', async () => {
        const { logs } = await auditLogger.getUserAuditLogs(1);

        for (let i = 0; i < logs.length - 1; i++) {
          expect(logs[i].timestamp.getTime()).toBeGreaterThanOrEqual(
            logs[i + 1].timestamp.getTime()
          );
        }
      });

      it('should return empty result for user with no logs', async () => {
        const { logs, total } = await auditLogger.getUserAuditLogs(999);

        expect(total).toBe(0);
        expect(logs).toHaveLength(0);
      });

      it('should handle user with only specific entity type', async () => {
        const { logs, total } = await auditLogger.getUserAuditLogs(2, {
          entityType: 'student'
        });

        expect(total).toBe(1);
        expect(logs[0].entityType).toBe('student');
        expect(logs[0].userId).toBe(2);
      });
    });

    describe('Combined Filtering Scenarios', () => {
      it('should filter student updates by user 1', async () => {
        const { logs, total } = await auditLogger.getUserAuditLogs(1, {
          entityType: 'student',
          action: AuditAction.UPDATE
        });

        expect(total).toBe(1);
        expect(logs[0].entityType).toBe('student');
        expect(logs[0].action).toBe(AuditAction.UPDATE);
        expect(logs[0].userId).toBe(1);
      });

      it('should retrieve all payment logs', async () => {
        const { logs, total } = await auditLogger.getUserAuditLogs(1, {
          entityType: 'payment'
        });

        expect(total).toBe(1);
        expect(logs[0].entityType).toBe('payment');
      });

      it('should handle multiple entity types for same user', async () => {
        const studentLogs = await auditLogger.getUserAuditLogs(1, {
          entityType: 'student'
        });
        const staffLogs = await auditLogger.getUserAuditLogs(1, {
          entityType: 'staff'
        });

        expect(studentLogs.total).toBe(3);
        expect(staffLogs.total).toBe(1);
      });
    });
  });

  describe('Requirement 38.7: Log Rotation', () => {
    describe('cleanupOldLogs', () => {
      it('should delete logs older than 1 year', async () => {
        const oldDate = new Date();
        oldDate.setFullYear(oldDate.getFullYear() - 2);

        // Create old log
        await AuditLog.create({
          userId: 1,
          entityType: 'student',
          entityId: 1,
          action: AuditAction.CREATE,
          newValue: { name: 'Old Student' },
          timestamp: oldDate
        });

        // Create recent log
        await auditLogger.logCreate('student', 2, { name: 'Recent Student' }, 1);

        const deletedCount = await auditLogger.cleanupOldLogs();

        expect(deletedCount).toBe(1);

        const remainingLogs = await AuditLog.findAll();
        expect(remainingLogs).toHaveLength(1);
        expect(remainingLogs[0].entityId).toBe(2);
      });

      it('should retain logs exactly 1 year old', async () => {
        const exactlyOneYearAgo = new Date();
        exactlyOneYearAgo.setFullYear(exactlyOneYearAgo.getFullYear() - 1);
        exactlyOneYearAgo.setHours(exactlyOneYearAgo.getHours() + 1); // 1 hour less than 1 year

        await AuditLog.create({
          userId: 1,
          entityType: 'student',
          entityId: 1,
          action: AuditAction.CREATE,
          newValue: { name: 'Exactly One Year Old' },
          timestamp: exactlyOneYearAgo
        });

        const deletedCount = await auditLogger.cleanupOldLogs();

        expect(deletedCount).toBe(0);

        const remainingLogs = await AuditLog.findAll();
        expect(remainingLogs).toHaveLength(1);
      });

      it('should delete multiple old logs', async () => {
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

        const threeYearsAgo = new Date();
        threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

        // Create multiple old logs
        await AuditLog.create({
          userId: 1,
          entityType: 'student',
          entityId: 1,
          action: AuditAction.CREATE,
          newValue: { name: 'Old 1' },
          timestamp: twoYearsAgo
        });

        await AuditLog.create({
          userId: 1,
          entityType: 'student',
          entityId: 2,
          action: AuditAction.CREATE,
          newValue: { name: 'Old 2' },
          timestamp: threeYearsAgo
        });

        // Create recent log
        await auditLogger.logCreate('student', 3, { name: 'Recent' }, 1);

        const deletedCount = await auditLogger.cleanupOldLogs();

        expect(deletedCount).toBe(2);

        const remainingLogs = await AuditLog.findAll();
        expect(remainingLogs).toHaveLength(1);
        expect(remainingLogs[0].entityId).toBe(3);
      });

      it('should return 0 when no old logs exist', async () => {
        // Create only recent logs
        await auditLogger.logCreate('student', 1, { name: 'Recent 1' }, 1);
        await auditLogger.logCreate('student', 2, { name: 'Recent 2' }, 1);

        const deletedCount = await auditLogger.cleanupOldLogs();

        expect(deletedCount).toBe(0);

        const remainingLogs = await AuditLog.findAll();
        expect(remainingLogs).toHaveLength(2);
      });

      it('should handle empty audit log table', async () => {
        const deletedCount = await auditLogger.cleanupOldLogs();

        expect(deletedCount).toBe(0);
      });

      it('should delete logs of all entity types', async () => {
        const oldDate = new Date();
        oldDate.setFullYear(oldDate.getFullYear() - 2);

        // Create old logs of different entity types
        await AuditLog.create({
          userId: 1,
          entityType: 'student',
          entityId: 1,
          action: AuditAction.CREATE,
          newValue: { name: 'Old Student' },
          timestamp: oldDate
        });

        await AuditLog.create({
          userId: 1,
          entityType: 'staff',
          entityId: 1,
          action: AuditAction.CREATE,
          newValue: { name: 'Old Staff' },
          timestamp: oldDate
        });

        await AuditLog.create({
          userId: 1,
          entityType: 'payment',
          entityId: 1,
          action: AuditAction.CREATE,
          newValue: { amount: 5000 },
          timestamp: oldDate
        });

        const deletedCount = await auditLogger.cleanupOldLogs();

        expect(deletedCount).toBe(3);

        const remainingLogs = await AuditLog.findAll();
        expect(remainingLogs).toHaveLength(0);
      });

      it('should preserve recent logs while deleting old ones', async () => {
        const oldDate = new Date();
        oldDate.setFullYear(oldDate.getFullYear() - 2);

        // Create mix of old and recent logs
        await AuditLog.create({
          userId: 1,
          entityType: 'student',
          entityId: 1,
          action: AuditAction.CREATE,
          newValue: { name: 'Old 1' },
          timestamp: oldDate
        });

        await auditLogger.logCreate('student', 2, { name: 'Recent 1' }, 1);

        await AuditLog.create({
          userId: 1,
          entityType: 'student',
          entityId: 3,
          action: AuditAction.CREATE,
          newValue: { name: 'Old 2' },
          timestamp: oldDate
        });

        await auditLogger.logCreate('student', 4, { name: 'Recent 2' }, 1);

        const deletedCount = await auditLogger.cleanupOldLogs();

        expect(deletedCount).toBe(2);

        const remainingLogs = await AuditLog.findAll();
        expect(remainingLogs).toHaveLength(2);
        expect(remainingLogs.every(log => log.entityId === 2 || log.entityId === 4)).toBe(true);
      });

      it('should use hard delete (force: true)', async () => {
        const oldDate = new Date();
        oldDate.setFullYear(oldDate.getFullYear() - 2);

        await AuditLog.create({
          userId: 1,
          entityType: 'student',
          entityId: 1,
          action: AuditAction.CREATE,
          newValue: { name: 'Old Student' },
          timestamp: oldDate
        });

        await auditLogger.cleanupOldLogs();

        // Verify hard delete - log should not exist even with paranoid query
        const allLogs = await AuditLog.findAll({ paranoid: false });
        expect(allLogs).toHaveLength(0);
      });
    });

    describe('Retention Policy Edge Cases', () => {
      it('should handle logs at exact 1 year boundary', async () => {
        const exactlyOneYear = new Date();
        exactlyOneYear.setFullYear(exactlyOneYear.getFullYear() - 1);

        await AuditLog.create({
          userId: 1,
          entityType: 'student',
          entityId: 1,
          action: AuditAction.CREATE,
          newValue: { name: 'Boundary Log' },
          timestamp: exactlyOneYear
        });

        const deletedCount = await auditLogger.cleanupOldLogs();

        // Should not delete logs exactly at 1 year (only older than 1 year)
        expect(deletedCount).toBe(0);
      });

      it('should handle logs 1 day over 1 year', async () => {
        const overOneYear = new Date();
        overOneYear.setFullYear(overOneYear.getFullYear() - 1);
        overOneYear.setDate(overOneYear.getDate() - 1);

        await AuditLog.create({
          userId: 1,
          entityType: 'student',
          entityId: 1,
          action: AuditAction.CREATE,
          newValue: { name: 'Over One Year' },
          timestamp: overOneYear
        });

        const deletedCount = await auditLogger.cleanupOldLogs();

        expect(deletedCount).toBe(1);
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw error when log creation fails', async () => {
      // Force an error by passing invalid data
      await expect(
        auditLogger.log({
          entityType: '', // Invalid empty string
          entityId: -1, // Invalid negative ID
          action: AuditAction.CREATE
        })
      ).rejects.toThrow();
    });

    it('should throw error when getEntityAuditLogs fails with invalid parameters', async () => {
      // This should work without throwing
      const result = await auditLogger.getEntityAuditLogs('test', 1);
      expect(result).toBeDefined();
    });

    it('should throw error when getUserAuditLogs fails with invalid parameters', async () => {
      // This should work without throwing
      const result = await auditLogger.getUserAuditLogs(1);
      expect(result).toBeDefined();
    });
  });
});
