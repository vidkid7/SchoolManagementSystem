import auditLogger from '../auditLogger';
import AuditLog, { AuditAction } from '@models/AuditLog.model';
import sequelize from '@config/database';

/**
 * Audit Logger Integration Tests
 * Tests comprehensive audit logging for all requirement categories
 * 
 * Requirements: 38.1, 38.2, 38.3, 38.4
 */

describe('Audit Logger Integration Tests', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await AuditLog.destroy({ where: {}, force: true });
  });

  describe('Requirement 38.1: Authentication Attempts', () => {
    it('should log successful authentication', async () => {
      const auditLog = await auditLogger.logCreate(
        'authentication',
        1,
        {
          username: 'testuser',
          success: true,
          timestamp: new Date()
        },
        1
      );

      expect(auditLog).toBeDefined();
      expect(auditLog.entityType).toBe('authentication');
      expect(auditLog.action).toBe(AuditAction.CREATE);
      expect(auditLog.newValue).toMatchObject({
        username: 'testuser',
        success: true
      });
    });

    it('should log failed authentication attempts', async () => {
      const auditLog = await auditLogger.logCreate(
        'authentication',
        0,
        {
          username: 'testuser',
          success: false,
          reason: 'invalid_password',
          timestamp: new Date()
        },
        null
      );

      expect(auditLog).toBeDefined();
      expect(auditLog.entityType).toBe('authentication');
      expect(auditLog.userId).toBeNull();
      expect(auditLog.newValue).toMatchObject({
        success: false,
        reason: 'invalid_password'
      });
    });

    it('should log account lockout events', async () => {
      const auditLog = await auditLogger.logCreate(
        'authentication',
        1,
        {
          username: 'testuser',
          event: 'account_locked',
          failedAttempts: 5,
          lockoutDuration: 900,
          timestamp: new Date()
        },
        null
      );

      expect(auditLog).toBeDefined();
      expect(auditLog.newValue).toMatchObject({
        event: 'account_locked',
        failedAttempts: 5
      });
    });
  });

  describe('Requirement 38.2: Data Modifications', () => {
    it('should log student creation', async () => {
      const studentData = {
        studentId: 'STU-2024-00001',
        firstNameEn: 'John',
        lastNameEn: 'Doe',
        email: 'john.doe@example.com'
      };

      const auditLog = await auditLogger.logCreate(
        'student',
        1,
        studentData,
        1
      );

      expect(auditLog).toBeDefined();
      expect(auditLog.entityType).toBe('student');
      expect(auditLog.action).toBe(AuditAction.CREATE);
      expect(auditLog.newValue).toMatchObject(studentData);
      expect(auditLog.oldValue).toBeNull();
    });

    it('should log student updates with changed fields', async () => {
      const oldData = {
        studentId: 'STU-2024-00001',
        firstNameEn: 'John',
        lastNameEn: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890'
      };

      const newData = {
        studentId: 'STU-2024-00001',
        firstNameEn: 'John',
        lastNameEn: 'Smith',
        email: 'john.smith@example.com',
        phone: '1234567890'
      };

      const auditLog = await auditLogger.logUpdate(
        'student',
        1,
        oldData,
        newData,
        1
      );

      expect(auditLog).toBeDefined();
      expect(auditLog.action).toBe(AuditAction.UPDATE);
      expect(auditLog.changedFields).toEqual(['lastNameEn', 'email']);
      expect(auditLog.oldValue).toMatchObject(oldData);
      expect(auditLog.newValue).toMatchObject(newData);
    });

    it('should log staff deletion', async () => {
      const staffData = {
        staffId: 'STF-2024-00001',
        name: 'Jane Teacher',
        position: 'Math Teacher'
      };

      const auditLog = await auditLogger.logDelete(
        'staff',
        1,
        staffData,
        1
      );

      expect(auditLog).toBeDefined();
      expect(auditLog.action).toBe(AuditAction.DELETE);
      expect(auditLog.oldValue).toMatchObject(staffData);
      expect(auditLog.newValue).toBeNull();
    });

    it('should log data restoration', async () => {
      const restoredData = {
        studentId: 'STU-2024-00001',
        firstNameEn: 'John',
        lastNameEn: 'Doe',
        status: 'active'
      };

      const auditLog = await auditLogger.logRestore(
        'student',
        1,
        restoredData,
        1
      );

      expect(auditLog).toBeDefined();
      expect(auditLog.action).toBe(AuditAction.RESTORE);
      expect(auditLog.newValue).toMatchObject(restoredData);
    });

    it('should log multiple entity types', async () => {
      await auditLogger.logCreate('student', 1, { name: 'Student 1' }, 1);
      await auditLogger.logCreate('staff', 2, { name: 'Staff 1' }, 1);
      await auditLogger.logCreate('exam', 3, { name: 'Exam 1' }, 1);

      const logs = await AuditLog.findAll();
      expect(logs).toHaveLength(3);

      const entityTypes = logs.map(log => log.entityType);
      expect(entityTypes).toContain('student');
      expect(entityTypes).toContain('staff');
      expect(entityTypes).toContain('exam');
    });
  });

  describe('Requirement 38.3: Administrative Actions', () => {
    it('should log role creation', async () => {
      const roleData = {
        code: 'custom_role',
        name: 'Custom Role',
        description: 'A custom role for testing'
      };

      const auditLog = await auditLogger.logCreate(
        'role',
        1,
        roleData,
        1
      );

      expect(auditLog).toBeDefined();
      expect(auditLog.entityType).toBe('role');
      expect(auditLog.newValue).toMatchObject(roleData);
    });

    it('should log role updates', async () => {
      const oldRole = {
        code: 'custom_role',
        name: 'Custom Role',
        description: 'Old description'
      };

      const newRole = {
        code: 'custom_role',
        name: 'Updated Custom Role',
        description: 'New description'
      };

      const auditLog = await auditLogger.logUpdate(
        'role',
        1,
        oldRole,
        newRole,
        1
      );

      expect(auditLog).toBeDefined();
      expect(auditLog.changedFields).toEqual(['name', 'description']);
    });

    it('should log permission assignments', async () => {
      const auditLog = await auditLogger.logUpdate(
        'role_permission',
        1,
        { permissionIds: ['perm1', 'perm2'] },
        { permissionIds: ['perm1', 'perm2', 'perm3'] },
        1
      );

      expect(auditLog).toBeDefined();
      expect(auditLog.entityType).toBe('role_permission');
      expect(auditLog.action).toBe(AuditAction.UPDATE);
    });

    it('should log system configuration changes', async () => {
      const oldConfig = {
        schoolName: 'Old School Name',
        academicYearStart: '2024-04-01'
      };

      const newConfig = {
        schoolName: 'New School Name',
        academicYearStart: '2024-04-01'
      };

      const auditLog = await auditLogger.logUpdate(
        'system_config',
        1,
        oldConfig,
        newConfig,
        1
      );

      expect(auditLog).toBeDefined();
      expect(auditLog.changedFields).toEqual(['schoolName']);
    });

    it('should log grading scheme modifications', async () => {
      const auditLog = await auditLogger.logUpdate(
        'grading_scheme',
        1,
        { name: 'NEB Standard', isDefault: true },
        { name: 'NEB Standard', isDefault: false },
        1
      );

      expect(auditLog).toBeDefined();
      expect(auditLog.changedFields).toEqual(['isDefault']);
    });
  });

  describe('Requirement 38.4: Financial Transactions', () => {
    it('should log payment creation', async () => {
      const paymentData = {
        receiptNumber: 'RCP-2024-00001',
        invoiceId: 1,
        studentId: 1,
        amount: 5000,
        paymentMethod: 'cash',
        paymentDate: '2024-01-15',
        receivedBy: 1,
        status: 'completed'
      };

      const auditLog = await auditLogger.logCreate(
        'payment',
        1,
        paymentData,
        1
      );

      expect(auditLog).toBeDefined();
      expect(auditLog.entityType).toBe('payment');
      expect(auditLog.newValue).toMatchObject(paymentData);
    });

    it('should log payment refunds', async () => {
      const oldPayment = {
        status: 'completed',
        paidAmount: 5000,
        balance: 0
      };

      const refundData = {
        status: 'refunded',
        refundedBy: 1,
        reason: 'Student withdrawal',
        refundAmount: 5000,
        paidAmount: 0,
        balance: 5000
      };

      const auditLog = await auditLogger.logUpdate(
        'payment',
        1,
        oldPayment,
        refundData,
        1
      );

      expect(auditLog).toBeDefined();
      expect(auditLog.changedFields).toContain('status');
      expect(auditLog.newValue).toMatchObject({
        status: 'refunded',
        refundAmount: 5000
      });
    });

    it('should log invoice generation', async () => {
      const invoiceData = {
        invoiceNumber: 'INV-2024-00001',
        studentId: 1,
        totalAmount: 10000,
        dueDate: '2024-02-15',
        status: 'pending'
      };

      const auditLog = await auditLogger.logCreate(
        'invoice',
        1,
        invoiceData,
        1
      );

      expect(auditLog).toBeDefined();
      expect(auditLog.entityType).toBe('invoice');
      expect(auditLog.newValue).toMatchObject(invoiceData);
    });

    it('should log fee structure changes', async () => {
      const oldStructure = {
        name: 'Class 10 Fees',
        totalAmount: 50000
      };

      const newStructure = {
        name: 'Class 10 Fees',
        totalAmount: 55000
      };

      const auditLog = await auditLogger.logUpdate(
        'fee_structure',
        1,
        oldStructure,
        newStructure,
        1
      );

      expect(auditLog).toBeDefined();
      expect(auditLog.changedFields).toEqual(['totalAmount']);
    });

    it('should log payment gateway transactions', async () => {
      const gatewayData = {
        gateway: 'esewa',
        transactionId: 'ESW-TXN-123456',
        amount: 10000,
        status: 'success',
        invoiceId: 1
      };

      const auditLog = await auditLogger.logCreate(
        'payment_gateway_transaction',
        1,
        gatewayData,
        1
      );

      expect(auditLog).toBeDefined();
      expect(auditLog.newValue).toMatchObject(gatewayData);
    });
  });

  describe('Audit Log Querying', () => {
    beforeEach(async () => {
      // Create sample audit logs
      await auditLogger.logCreate('student', 1, { name: 'Student 1' }, 1);
      await auditLogger.logUpdate('student', 1, { name: 'Student 1' }, { name: 'Student 1 Updated' }, 1);
      await auditLogger.logCreate('student', 2, { name: 'Student 2' }, 2);
      await auditLogger.logCreate('payment', 1, { amount: 5000 }, 1);
    });

    it('should retrieve audit logs for specific entity', async () => {
      const { logs, total } = await auditLogger.getEntityAuditLogs('student', 1);

      expect(total).toBe(2);
      expect(logs).toHaveLength(2);
      expect(logs[0].entityType).toBe('student');
      expect(logs[0].entityId).toBe(1);
    });

    it('should retrieve audit logs for specific user', async () => {
      const { logs, total } = await auditLogger.getUserAuditLogs(1);

      expect(total).toBe(3);
      expect(logs).toHaveLength(3);
      expect(logs.every(log => log.userId === 1)).toBe(true);
    });

    it('should filter by action type', async () => {
      const { logs, total } = await auditLogger.getEntityAuditLogs('student', 1, {
        action: AuditAction.UPDATE
      });

      expect(total).toBe(1);
      expect(logs[0].action).toBe(AuditAction.UPDATE);
    });

    it('should support pagination', async () => {
      const { logs: page1, total } = await auditLogger.getUserAuditLogs(1, {
        limit: 2,
        offset: 0
      });

      expect(total).toBe(3);
      expect(page1).toHaveLength(2);

      const { logs: page2 } = await auditLogger.getUserAuditLogs(1, {
        limit: 2,
        offset: 2
      });

      expect(page2).toHaveLength(1);
    });
  });

  describe('Audit Log Retention', () => {
    it('should clean up logs older than 1 year', async () => {
      // Create old log
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

      // Create recent log
      await auditLogger.logCreate('student', 2, { name: 'Recent Student' }, 1);

      const deletedCount = await auditLogger.cleanupOldLogs();

      expect(deletedCount).toBe(1);

      const remainingLogs = await AuditLog.findAll();
      expect(remainingLogs).toHaveLength(1);
      expect(remainingLogs[0].entityId).toBe(2);
    });
  });

  describe('IP Address and User Agent Tracking', () => {
    it('should store IP address and user agent', async () => {
      const mockRequest = {
        get: (header: string) => {
          if (header === 'user-agent') return 'Mozilla/5.0 Test Browser';
          return undefined;
        },
        ip: '192.168.1.1'
      } as any;

      const auditLog = await auditLogger.logCreate(
        'student',
        1,
        { name: 'Test Student' },
        1,
        mockRequest
      );

      expect(auditLog.ipAddress).toBe('192.168.1.1');
      expect(auditLog.userAgent).toBe('Mozilla/5.0 Test Browser');
    });

    it('should handle proxy headers for IP extraction', async () => {
      const mockRequest = {
        get: (header: string) => {
          if (header === 'x-forwarded-for') return '10.0.0.1, 192.168.1.1';
          return undefined;
        }
      } as any;

      const auditLog = await auditLogger.logCreate(
        'student',
        1,
        { name: 'Test Student' },
        1,
        mockRequest
      );

      expect(auditLog.ipAddress).toBe('10.0.0.1');
    });
  });
});
