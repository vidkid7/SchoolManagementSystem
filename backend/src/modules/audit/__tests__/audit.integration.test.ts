import request from 'supertest';
import app from '@src/app';
import sequelize from '@config/database';
import AuditLog, { AuditAction } from '@models/AuditLog.model';
import User from '@models/User.model';
import { generateToken } from '@utils/jwt';

/**
 * Audit Integration Tests
 * Requirements: 38.5, 38.6, 38.7
 */

describe('Audit API Integration Tests', () => {
  let adminToken: string;
  let adminUser: User;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Create admin user
    adminUser = await User.create({
      username: 'admin',
      email: 'admin@test.com',
      password: 'hashedpassword',
      role: 'school_admin',
      isActive: true
    });

    adminToken = generateToken({ userId: adminUser.userId, role: adminUser.role });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await AuditLog.destroy({ where: {}, force: true });
  });

  describe('GET /api/v1/audit/logs', () => {
    it('should fetch audit logs with pagination', async () => {
      // Create test audit logs
      await AuditLog.bulkCreate([
        {
          userId: adminUser.userId,
          entityType: 'student',
          entityId: 1,
          action: AuditAction.CREATE,
          newValue: { name: 'Student 1' },
          timestamp: new Date()
        },
        {
          userId: adminUser.userId,
          entityType: 'student',
          entityId: 2,
          action: AuditAction.UPDATE,
          oldValue: { name: 'Student 2 Old' },
          newValue: { name: 'Student 2 New' },
          changedFields: ['name'],
          timestamp: new Date()
        }
      ]);

      const response = await request(app)
        .get('/api/v1/audit/logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1
      });
    });

    it('should filter logs by entity type', async () => {
      await AuditLog.bulkCreate([
        {
          userId: adminUser.userId,
          entityType: 'student',
          entityId: 1,
          action: AuditAction.CREATE,
          timestamp: new Date()
        },
        {
          userId: adminUser.userId,
          entityType: 'staff',
          entityId: 1,
          action: AuditAction.CREATE,
          timestamp: new Date()
        }
      ]);

      const response = await request(app)
        .get('/api/v1/audit/logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ entityType: 'student' })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].entityType).toBe('student');
    });

    it('should filter logs by action', async () => {
      await AuditLog.bulkCreate([
        {
          userId: adminUser.userId,
          entityType: 'student',
          entityId: 1,
          action: AuditAction.CREATE,
          timestamp: new Date()
        },
        {
          userId: adminUser.userId,
          entityType: 'student',
          entityId: 1,
          action: AuditAction.UPDATE,
          timestamp: new Date()
        },
        {
          userId: adminUser.userId,
          entityType: 'student',
          entityId: 1,
          action: AuditAction.DELETE,
          timestamp: new Date()
        }
      ]);

      const response = await request(app)
        .get('/api/v1/audit/logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ action: 'update' })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].action).toBe('update');
    });

    it('should filter logs by date range', async () => {
      const oldDate = new Date('2023-01-01');
      const recentDate = new Date('2024-12-01');

      await AuditLog.bulkCreate([
        {
          userId: adminUser.userId,
          entityType: 'student',
          entityId: 1,
          action: AuditAction.CREATE,
          timestamp: oldDate
        },
        {
          userId: adminUser.userId,
          entityType: 'student',
          entityId: 2,
          action: AuditAction.CREATE,
          timestamp: recentDate
        }
      ]);

      const response = await request(app)
        .get('/api/v1/audit/logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-12-31T23:59:59.999Z'
        })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(new Date(response.body.data[0].timestamp).getFullYear()).toBe(2024);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/v1/audit/logs')
        .expect(401);
    });

    it('should require admin role', async () => {
      const teacherUser = await User.create({
        username: 'teacher',
        email: 'teacher@test.com',
        password: 'hashedpassword',
        role: 'subject_teacher',
        isActive: true
      });

      const teacherToken = generateToken({ 
        userId: teacherUser.userId, 
        role: teacherUser.role 
      });

      await request(app)
        .get('/api/v1/audit/logs')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);
    });
  });

  describe('GET /api/v1/audit/logs/:id', () => {
    it('should fetch audit log by ID', async () => {
      const log = await AuditLog.create({
        userId: adminUser.userId,
        entityType: 'student',
        entityId: 1,
        action: AuditAction.CREATE,
        newValue: { name: 'Test Student' },
        timestamp: new Date()
      });

      const response = await request(app)
        .get(`/api/v1/audit/logs/${log.auditLogId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.auditLogId).toBe(log.auditLogId);
      expect(response.body.data.entityType).toBe('student');
    });

    it('should return 404 for non-existent log', async () => {
      await request(app)
        .get('/api/v1/audit/logs/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('GET /api/v1/audit/entity/:entityType/:entityId', () => {
    it('should fetch logs for specific entity', async () => {
      await AuditLog.bulkCreate([
        {
          userId: adminUser.userId,
          entityType: 'student',
          entityId: 100,
          action: AuditAction.CREATE,
          timestamp: new Date()
        },
        {
          userId: adminUser.userId,
          entityType: 'student',
          entityId: 100,
          action: AuditAction.UPDATE,
          timestamp: new Date()
        },
        {
          userId: adminUser.userId,
          entityType: 'student',
          entityId: 200,
          action: AuditAction.CREATE,
          timestamp: new Date()
        }
      ]);

      const response = await request(app)
        .get('/api/v1/audit/entity/student/100')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((log: any) => 
        log.entityType === 'student' && log.entityId === 100
      )).toBe(true);
    });
  });

  describe('GET /api/v1/audit/user/:userId', () => {
    it('should fetch logs for specific user', async () => {
      const otherUser = await User.create({
        username: 'other',
        email: 'other@test.com',
        password: 'hashedpassword',
        role: 'subject_teacher',
        isActive: true
      });

      await AuditLog.bulkCreate([
        {
          userId: adminUser.userId,
          entityType: 'student',
          entityId: 1,
          action: AuditAction.CREATE,
          timestamp: new Date()
        },
        {
          userId: otherUser.userId,
          entityType: 'student',
          entityId: 2,
          action: AuditAction.CREATE,
          timestamp: new Date()
        }
      ]);

      const response = await request(app)
        .get(`/api/v1/audit/user/${adminUser.userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].userId).toBe(adminUser.userId);
    });
  });

  describe('GET /api/v1/audit/stats', () => {
    it('should return audit log statistics', async () => {
      await AuditLog.bulkCreate([
        {
          userId: adminUser.userId,
          entityType: 'student',
          entityId: 1,
          action: AuditAction.CREATE,
          timestamp: new Date()
        },
        {
          userId: adminUser.userId,
          entityType: 'student',
          entityId: 1,
          action: AuditAction.UPDATE,
          timestamp: new Date()
        },
        {
          userId: adminUser.userId,
          entityType: 'staff',
          entityId: 1,
          action: AuditAction.CREATE,
          timestamp: new Date()
        }
      ]);

      const response = await request(app)
        .get('/api/v1/audit/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalLogs).toBe(3);
      expect(response.body.data.logsByAction).toHaveProperty('create');
      expect(response.body.data.logsByAction).toHaveProperty('update');
      expect(response.body.data.logsByEntityType).toHaveProperty('student');
      expect(response.body.data.logsByEntityType).toHaveProperty('staff');
    });
  });

  describe('POST /api/v1/audit/rotate', () => {
    it('should rotate old audit logs', async () => {
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 2);

      const recentDate = new Date();

      await AuditLog.bulkCreate([
        {
          userId: adminUser.userId,
          entityType: 'student',
          entityId: 1,
          action: AuditAction.CREATE,
          timestamp: oldDate
        },
        {
          userId: adminUser.userId,
          entityType: 'student',
          entityId: 2,
          action: AuditAction.CREATE,
          timestamp: recentDate
        }
      ]);

      const response = await request(app)
        .post('/api/v1/audit/rotate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ retentionDays: 365 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deletedCount).toBe(1);

      // Verify only recent log remains
      const remainingLogs = await AuditLog.findAll();
      expect(remainingLogs).toHaveLength(1);
    });
  });

  describe('GET /api/v1/audit/export', () => {
    it('should export audit logs', async () => {
      await AuditLog.bulkCreate([
        {
          userId: adminUser.userId,
          entityType: 'student',
          entityId: 1,
          action: AuditAction.CREATE,
          timestamp: new Date()
        },
        {
          userId: adminUser.userId,
          entityType: 'student',
          entityId: 2,
          action: AuditAction.CREATE,
          timestamp: new Date()
        }
      ]);

      const response = await request(app)
        .get('/api/v1/audit/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.count).toBe(2);
    });
  });
});
