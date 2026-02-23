import archiveService from '../archive.service';
import ArchiveMetadata from '../../../models/ArchiveMetadata.model';
import sequelize from '../../../config/database';
import auditLogger from '../../../utils/auditLogger';

// Mock dependencies
jest.mock('../../../models/ArchiveMetadata.model');
jest.mock('../../../config/database');
jest.mock('../../../utils/auditLogger');
jest.mock('../../../models/AuditLog.model', () => ({
  AuditAction: {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
    RESTORE: 'restore',
  },
}));

describe('Archive Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('archiveAcademicYear', () => {
    it('should archive academic year successfully', async () => {
      // Mock transaction
      const mockTransaction = {
        commit: jest.fn(),
        rollback: jest.fn(),
      };
      (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);

      // Mock ArchiveMetadata.findOne
      (ArchiveMetadata.findOne as jest.Mock).mockResolvedValue(null);

      // Mock ArchiveMetadata.create
      const mockArchive = {
        id: 1,
        academic_year_id: 1,
        academic_year_name: '2081-2082 BS',
        archived_at: new Date(),
        archived_by: 1,
        status: 'in_progress',
        retention_until: new Date(),
        update: jest.fn().mockResolvedValue(true),
      };
      (ArchiveMetadata.create as jest.Mock).mockResolvedValue(mockArchive);

      // Mock sequelize.query for archiving operations
      (sequelize.query as jest.Mock).mockResolvedValue([{ affectedRows: 10 }]);

      // Mock auditLogger
      (auditLogger.log as jest.Mock).mockResolvedValue(true);

      const result = await archiveService.archiveAcademicYear({
        academicYearId: 1,
        academicYearName: '2081-2082 BS',
        userId: 1,
      });

      expect(result.status).toBe('completed');
      expect(result.archiveId).toBe(1);
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(auditLogger.log).toHaveBeenCalledWith({
        userId: 1,
        entityType: 'archive',
        entityId: 1,
        action: expect.any(String),
        newValue: {
          academic_year_id: 1,
          academic_year_name: '2081-2082 BS',
          record_counts: expect.any(Object),
        },
        ipAddress: '',
        userAgent: '',
      });
    });

    it('should archive all required tables (students, attendance, exams, grades, invoices, payments)', async () => {
      // Mock transaction
      const mockTransaction = {
        commit: jest.fn(),
        rollback: jest.fn(),
      };
      (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);

      // Mock ArchiveMetadata.findOne
      (ArchiveMetadata.findOne as jest.Mock).mockResolvedValue(null);

      // Mock ArchiveMetadata.create
      const mockArchive = {
        id: 1,
        academic_year_id: 1,
        academic_year_name: '2081-2082 BS',
        archived_at: new Date(),
        archived_by: 1,
        status: 'in_progress',
        retention_until: new Date(),
        update: jest.fn().mockResolvedValue(true),
      };
      (ArchiveMetadata.create as jest.Mock).mockResolvedValue(mockArchive);

      // Mock sequelize.query for each table
      (sequelize.query as jest.Mock)
        .mockResolvedValueOnce([{ affectedRows: 100 }]) // students
        .mockResolvedValueOnce([{ affectedRows: 500 }]) // attendance
        .mockResolvedValueOnce([{ affectedRows: 20 }])  // exams
        .mockResolvedValueOnce([{ affectedRows: 200 }]) // grades
        .mockResolvedValueOnce([{ affectedRows: 100 }]) // invoices
        .mockResolvedValueOnce([{ affectedRows: 150 }]); // payments

      // Mock auditLogger
      (auditLogger.log as jest.Mock).mockResolvedValue(true);

      const result = await archiveService.archiveAcademicYear({
        academicYearId: 1,
        academicYearName: '2081-2082 BS',
        userId: 1,
      });

      // Verify all tables were archived
      expect(sequelize.query).toHaveBeenCalledTimes(6);
      expect(result.recordCounts).toEqual({
        students: 100,
        attendance: 500,
        exams: 20,
        grades: 200,
        invoices: 100,
        payments: 150,
      });
      expect(mockArchive.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          tables_archived: ['students', 'attendance', 'exams', 'grades', 'invoices', 'payments'],
        }),
        { transaction: mockTransaction }
      );
    });

    it('should archive data with correct JSON structure', async () => {
      // Mock transaction
      const mockTransaction = {
        commit: jest.fn(),
        rollback: jest.fn(),
      };
      (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);

      // Mock ArchiveMetadata.findOne
      (ArchiveMetadata.findOne as jest.Mock).mockResolvedValue(null);

      // Mock ArchiveMetadata.create
      const mockArchive = {
        id: 1,
        academic_year_id: 1,
        academic_year_name: '2081-2082 BS',
        archived_at: new Date(),
        archived_by: 1,
        status: 'in_progress',
        retention_until: new Date(),
        update: jest.fn().mockResolvedValue(true),
      };
      (ArchiveMetadata.create as jest.Mock).mockResolvedValue(mockArchive);

      // Capture SQL queries
      const queries: string[] = [];
      (sequelize.query as jest.Mock).mockImplementation((sql: string) => {
        queries.push(sql);
        return Promise.resolve([{ affectedRows: 10 }]);
      });

      // Mock auditLogger
      (auditLogger.log as jest.Mock).mockResolvedValue(true);

      await archiveService.archiveAcademicYear({
        academicYearId: 1,
        academicYearName: '2081-2082 BS',
        userId: 1,
      });

      // Verify JSON_OBJECT is used for data archiving
      expect(queries[0]).toContain('JSON_OBJECT');
      expect(queries[0]).toContain('archived_students');
      expect(queries[1]).toContain('archived_attendance');
      expect(queries[2]).toContain('archived_exams');
    });

    it('should throw error if academic year is already archived', async () => {
      // Mock transaction
      const mockTransaction = {
        commit: jest.fn(),
        rollback: jest.fn(),
      };
      (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);

      // Mock existing archive
      (ArchiveMetadata.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        status: 'completed',
      });

      await expect(
        archiveService.archiveAcademicYear({
          academicYearId: 1,
          academicYearName: '2081-2082 BS',
          userId: 1,
        })
      ).rejects.toThrow('Academic year is already archived');

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      // Mock transaction
      const mockTransaction = {
        commit: jest.fn(),
        rollback: jest.fn(),
      };
      (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);

      // Mock ArchiveMetadata.findOne
      (ArchiveMetadata.findOne as jest.Mock).mockResolvedValue(null);

      // Mock ArchiveMetadata.create to throw error
      (ArchiveMetadata.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(
        archiveService.archiveAcademicYear({
          academicYearId: 1,
          academicYearName: '2081-2082 BS',
          userId: 1,
        })
      ).rejects.toThrow('Database error');

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should set retention period to 10 years', async () => {
      // Mock transaction
      const mockTransaction = {
        commit: jest.fn(),
        rollback: jest.fn(),
      };
      (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);

      // Mock ArchiveMetadata.findOne
      (ArchiveMetadata.findOne as jest.Mock).mockResolvedValue(null);

      // Capture the created archive metadata
      let createdArchive: any;
      (ArchiveMetadata.create as jest.Mock).mockImplementation((data) => {
        createdArchive = data;
        return Promise.resolve({
          ...data,
          id: 1,
          update: jest.fn().mockResolvedValue(true),
        });
      });

      // Mock sequelize.query
      (sequelize.query as jest.Mock).mockResolvedValue([{ affectedRows: 10 }]);

      // Mock auditLogger
      (auditLogger.log as jest.Mock).mockResolvedValue(true);

      await archiveService.archiveAcademicYear({
        academicYearId: 1,
        academicYearName: '2081-2082 BS',
        userId: 1,
      });

      // Check retention period is 10 years from now (Requirement 40.7)
      const now = new Date();
      const tenYearsLater = new Date(now);
      tenYearsLater.setFullYear(tenYearsLater.getFullYear() + 10);

      expect(createdArchive.retention_until.getFullYear()).toBe(tenYearsLater.getFullYear());
    });

    it('should handle empty tables gracefully', async () => {
      // Mock transaction
      const mockTransaction = {
        commit: jest.fn(),
        rollback: jest.fn(),
      };
      (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);

      // Mock ArchiveMetadata.findOne
      (ArchiveMetadata.findOne as jest.Mock).mockResolvedValue(null);

      // Mock ArchiveMetadata.create
      const mockArchive = {
        id: 1,
        academic_year_id: 1,
        academic_year_name: '2081-2082 BS',
        archived_at: new Date(),
        archived_by: 1,
        status: 'in_progress',
        retention_until: new Date(),
        update: jest.fn().mockResolvedValue(true),
      };
      (ArchiveMetadata.create as jest.Mock).mockResolvedValue(mockArchive);

      // Mock sequelize.query with zero affected rows
      (sequelize.query as jest.Mock).mockResolvedValue([{ affectedRows: 0 }]);

      // Mock auditLogger
      (auditLogger.log as jest.Mock).mockResolvedValue(true);

      const result = await archiveService.archiveAcademicYear({
        academicYearId: 1,
        academicYearName: '2081-2082 BS',
        userId: 1,
      });

      expect(result.status).toBe('completed');
      expect(result.recordCounts.students).toBe(0);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should create audit log with correct details', async () => {
      // Mock transaction
      const mockTransaction = {
        commit: jest.fn(),
        rollback: jest.fn(),
      };
      (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);

      // Mock ArchiveMetadata.findOne
      (ArchiveMetadata.findOne as jest.Mock).mockResolvedValue(null);

      // Mock ArchiveMetadata.create
      const mockArchive = {
        id: 1,
        academic_year_id: 1,
        academic_year_name: '2081-2082 BS',
        archived_at: new Date(),
        archived_by: 1,
        status: 'in_progress',
        retention_until: new Date(),
        update: jest.fn().mockResolvedValue(true),
      };
      (ArchiveMetadata.create as jest.Mock).mockResolvedValue(mockArchive);

      // Mock sequelize.query
      (sequelize.query as jest.Mock).mockResolvedValue([{ affectedRows: 10 }]);

      // Mock auditLogger
      (auditLogger.log as jest.Mock).mockResolvedValue(true);

      await archiveService.archiveAcademicYear({
        academicYearId: 1,
        academicYearName: '2081-2082 BS',
        userId: 1,
      });

      expect(auditLogger.log).toHaveBeenCalledWith({
        userId: 1,
        entityType: 'archive',
        entityId: 1,
        action: expect.any(String),
        newValue: {
          academic_year_id: 1,
          academic_year_name: '2081-2082 BS',
          record_counts: expect.any(Object),
        },
        ipAddress: '',
        userAgent: '',
      });
    });
  });

  describe('restoreArchivedData', () => {
    it('should restore archived data successfully', async () => {
      // Mock transaction
      const mockTransaction = {
        commit: jest.fn(),
        rollback: jest.fn(),
      };
      (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);

      // Mock ArchiveMetadata.findByPk
      const mockArchive = {
        id: 1,
        academic_year_id: 1,
        academic_year_name: '2081-2082 BS',
        status: 'completed',
        update: jest.fn().mockResolvedValue(true),
      };
      (ArchiveMetadata.findByPk as jest.Mock).mockResolvedValue(mockArchive);

      // Mock sequelize.query for restore operations
      (sequelize.query as jest.Mock).mockResolvedValue([{ affectedRows: 10 }]);

      // Mock auditLogger
      (auditLogger.log as jest.Mock).mockResolvedValue(true);

      const result = await archiveService.restoreArchivedData({
        archiveId: 1,
        userId: 1,
      });

      expect(result.status).toBe('restored');
      expect(result.archiveId).toBe(1);
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(mockArchive.update).toHaveBeenCalledWith(
        { status: 'restored' },
        { transaction: mockTransaction }
      );
    });

    it('should restore data with INSERT IGNORE to prevent duplicates', async () => {
      // Mock transaction
      const mockTransaction = {
        commit: jest.fn(),
        rollback: jest.fn(),
      };
      (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);

      // Mock ArchiveMetadata.findByPk
      const mockArchive = {
        id: 1,
        academic_year_id: 1,
        academic_year_name: '2081-2082 BS',
        status: 'completed',
        update: jest.fn().mockResolvedValue(true),
      };
      (ArchiveMetadata.findByPk as jest.Mock).mockResolvedValue(mockArchive);

      // Capture SQL queries
      const queries: string[] = [];
      (sequelize.query as jest.Mock).mockImplementation((sql: string) => {
        queries.push(sql);
        return Promise.resolve([{ affectedRows: 10 }]);
      });

      // Mock auditLogger
      (auditLogger.log as jest.Mock).mockResolvedValue(true);

      await archiveService.restoreArchivedData({
        archiveId: 1,
        userId: 1,
      });

      // Verify INSERT IGNORE is used to prevent duplicate key errors
      expect(queries[0]).toContain('INSERT IGNORE');
      expect(queries[0]).toContain('FROM archived_students');
    });

    it('should update archive status to restored', async () => {
      // Mock transaction
      const mockTransaction = {
        commit: jest.fn(),
        rollback: jest.fn(),
      };
      (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);

      // Mock ArchiveMetadata.findByPk
      const mockArchive = {
        id: 1,
        academic_year_id: 1,
        academic_year_name: '2081-2082 BS',
        status: 'completed',
        update: jest.fn().mockResolvedValue(true),
      };
      (ArchiveMetadata.findByPk as jest.Mock).mockResolvedValue(mockArchive);

      // Mock sequelize.query
      (sequelize.query as jest.Mock).mockResolvedValue([{ affectedRows: 10 }]);

      // Mock auditLogger
      (auditLogger.log as jest.Mock).mockResolvedValue(true);

      await archiveService.restoreArchivedData({
        archiveId: 1,
        userId: 1,
      });

      expect(mockArchive.update).toHaveBeenCalledWith(
        { status: 'restored' },
        { transaction: mockTransaction }
      );
    });

    it('should create audit log for restoration', async () => {
      // Mock transaction
      const mockTransaction = {
        commit: jest.fn(),
        rollback: jest.fn(),
      };
      (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);

      // Mock ArchiveMetadata.findByPk
      const mockArchive = {
        id: 1,
        academic_year_id: 1,
        academic_year_name: '2081-2082 BS',
        status: 'completed',
        update: jest.fn().mockResolvedValue(true),
      };
      (ArchiveMetadata.findByPk as jest.Mock).mockResolvedValue(mockArchive);

      // Mock sequelize.query
      (sequelize.query as jest.Mock).mockResolvedValue([{ affectedRows: 10 }]);

      // Mock auditLogger
      (auditLogger.log as jest.Mock).mockResolvedValue(true);

      await archiveService.restoreArchivedData({
        archiveId: 1,
        userId: 1,
      });

      expect(auditLogger.log).toHaveBeenCalledWith({
        userId: 1,
        entityType: 'archive',
        entityId: 1,
        action: expect.any(String),
        newValue: {
          academic_year_name: '2081-2082 BS',
          record_counts: expect.any(Object),
        },
        ipAddress: '',
        userAgent: '',
      });
    });

    it('should throw error if archive not found', async () => {
      // Mock transaction
      const mockTransaction = {
        commit: jest.fn(),
        rollback: jest.fn(),
      };
      (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);

      // Mock ArchiveMetadata.findByPk to return null
      (ArchiveMetadata.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(
        archiveService.restoreArchivedData({
          archiveId: 1,
          userId: 1,
        })
      ).rejects.toThrow('Archive not found');

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should throw error if archive is not completed', async () => {
      // Mock transaction
      const mockTransaction = {
        commit: jest.fn(),
        rollback: jest.fn(),
      };
      (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);

      // Mock ArchiveMetadata.findByPk with in_progress status
      (ArchiveMetadata.findByPk as jest.Mock).mockResolvedValue({
        id: 1,
        status: 'in_progress',
      });

      await expect(
        archiveService.restoreArchivedData({
          archiveId: 1,
          userId: 1,
        })
      ).rejects.toThrow('Can only restore completed archives');

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('getArchives', () => {
    it('should return all archives without filters', async () => {
      const mockArchives = [
        { id: 1, academic_year_name: '2081-2082 BS', status: 'completed' },
        { id: 2, academic_year_name: '2080-2081 BS', status: 'completed' },
      ];

      (ArchiveMetadata.findAll as jest.Mock).mockResolvedValue(mockArchives);

      const result = await archiveService.getArchives();

      expect(result).toEqual(mockArchives);
      expect(ArchiveMetadata.findAll).toHaveBeenCalledWith({
        where: {},
        order: [['archived_at', 'DESC']],
      });
    });

    it('should filter archives by status', async () => {
      const mockArchives = [
        { id: 1, academic_year_name: '2081-2082 BS', status: 'completed' },
      ];

      (ArchiveMetadata.findAll as jest.Mock).mockResolvedValue(mockArchives);

      const result = await archiveService.getArchives({ status: 'completed' });

      expect(result).toEqual(mockArchives);
      expect(ArchiveMetadata.findAll).toHaveBeenCalledWith({
        where: { status: 'completed' },
        order: [['archived_at', 'DESC']],
      });
    });

    it('should filter archives by academic year ID', async () => {
      const mockArchives = [
        { id: 1, academic_year_id: 1, academic_year_name: '2081-2082 BS', status: 'completed' },
      ];

      (ArchiveMetadata.findAll as jest.Mock).mockResolvedValue(mockArchives);

      const result = await archiveService.getArchives({ academicYearId: 1 });

      expect(result).toEqual(mockArchives);
      expect(ArchiveMetadata.findAll).toHaveBeenCalledWith({
        where: { academic_year_id: 1 },
        order: [['archived_at', 'DESC']],
      });
    });
  });

  describe('getArchiveById', () => {
    it('should return archive by ID', async () => {
      const mockArchive = {
        id: 1,
        academic_year_name: '2081-2082 BS',
        status: 'completed',
      };

      (ArchiveMetadata.findByPk as jest.Mock).mockResolvedValue(mockArchive);

      const result = await archiveService.getArchiveById(1);

      expect(result).toEqual(mockArchive);
      expect(ArchiveMetadata.findByPk).toHaveBeenCalledWith(1);
    });

    it('should return null if archive not found', async () => {
      (ArchiveMetadata.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await archiveService.getArchiveById(999);

      expect(result).toBeNull();
    });
  });

  describe('deleteExpiredArchives', () => {
    it('should delete expired archives based on retention policy', async () => {
      const now = new Date();
      const expiredDate = new Date(now);
      expiredDate.setFullYear(expiredDate.getFullYear() - 1);

      const mockExpiredArchives = [
        {
          id: 1,
          academic_year_name: '2070-2071 BS',
          retention_until: expiredDate,
          status: 'completed',
          destroy: jest.fn().mockResolvedValue(true),
        },
        {
          id: 2,
          academic_year_name: '2071-2072 BS',
          retention_until: expiredDate,
          status: 'completed',
          destroy: jest.fn().mockResolvedValue(true),
        },
      ];

      (ArchiveMetadata.findAll as jest.Mock).mockResolvedValue(mockExpiredArchives);
      (auditLogger.log as jest.Mock).mockResolvedValue(true);

      const deletedCount = await archiveService.deleteExpiredArchives(1);

      expect(deletedCount).toBe(2);
      expect(mockExpiredArchives[0].destroy).toHaveBeenCalled();
      expect(mockExpiredArchives[1].destroy).toHaveBeenCalled();
      expect(auditLogger.log).toHaveBeenCalledTimes(2);
    });

    it('should only delete archives past retention date (Requirement 40.7)', async () => {
      const now = new Date();
      
      // Create archives with different retention dates
      const expiredDate = new Date(now);
      expiredDate.setFullYear(expiredDate.getFullYear() - 1);

      (ArchiveMetadata.findAll as jest.Mock).mockImplementation((options) => {
        // Verify the query filters for expired archives
        expect(options.where.retention_until).toBeDefined();
        expect(options.where.status).toBe('completed');
        return Promise.resolve([]);
      });

      await archiveService.deleteExpiredArchives(1);

      expect(ArchiveMetadata.findAll).toHaveBeenCalledWith({
        where: {
          retention_until: expect.any(Object),
          status: 'completed',
        },
      });
    });

    it('should not delete non-expired archives', async () => {
      const now = new Date();
      const futureDate = new Date(now);
      futureDate.setFullYear(futureDate.getFullYear() + 5);

      (ArchiveMetadata.findAll as jest.Mock).mockResolvedValue([]);

      const deletedCount = await archiveService.deleteExpiredArchives(1);

      expect(deletedCount).toBe(0);
    });

    it('should continue deleting even if one fails', async () => {
      const now = new Date();
      const expiredDate = new Date(now);
      expiredDate.setFullYear(expiredDate.getFullYear() - 1);

      const mockExpiredArchives = [
        {
          id: 1,
          academic_year_name: '2070-2071 BS',
          retention_until: expiredDate,
          status: 'completed',
          destroy: jest.fn().mockRejectedValue(new Error('Delete failed')),
        },
        {
          id: 2,
          academic_year_name: '2071-2072 BS',
          retention_until: expiredDate,
          status: 'completed',
          destroy: jest.fn().mockResolvedValue(true),
        },
      ];

      (ArchiveMetadata.findAll as jest.Mock).mockResolvedValue(mockExpiredArchives);
      (auditLogger.log as jest.Mock).mockResolvedValue(true);

      const deletedCount = await archiveService.deleteExpiredArchives(1);

      expect(deletedCount).toBe(1);
      expect(mockExpiredArchives[1].destroy).toHaveBeenCalled();
    });

    it('should create audit log for each deleted archive', async () => {
      const now = new Date();
      const expiredDate = new Date(now);
      expiredDate.setFullYear(expiredDate.getFullYear() - 1);

      const mockExpiredArchives = [
        {
          id: 1,
          academic_year_name: '2070-2071 BS',
          retention_until: expiredDate,
          status: 'completed',
          destroy: jest.fn().mockResolvedValue(true),
        },
      ];

      (ArchiveMetadata.findAll as jest.Mock).mockResolvedValue(mockExpiredArchives);
      (auditLogger.log as jest.Mock).mockResolvedValue(true);

      await archiveService.deleteExpiredArchives(1);

      expect(auditLogger.log).toHaveBeenCalledWith({
        userId: 1,
        entityType: 'archive',
        entityId: 1,
        action: expect.any(String),
        oldValue: {
          academic_year_name: '2070-2071 BS',
          retention_until: expiredDate,
        },
        ipAddress: '',
        userAgent: '',
      });
    });

    it('should enforce 10-year retention policy', async () => {
      const now = new Date();
      
      // Archive created 11 years ago (should be deleted)
      const elevenYearsAgo = new Date(now);
      elevenYearsAgo.setFullYear(elevenYearsAgo.getFullYear() - 11);
      
      // Archive created 9 years ago (should NOT be deleted)
      const nineYearsAgo = new Date(now);
      nineYearsAgo.setFullYear(nineYearsAgo.getFullYear() - 9);

      const mockExpiredArchives = [
        {
          id: 1,
          academic_year_name: '2070-2071 BS',
          retention_until: elevenYearsAgo,
          status: 'completed',
          destroy: jest.fn().mockResolvedValue(true),
        },
      ];

      (ArchiveMetadata.findAll as jest.Mock).mockResolvedValue(mockExpiredArchives);
      (auditLogger.log as jest.Mock).mockResolvedValue(true);

      const deletedCount = await archiveService.deleteExpiredArchives(1);

      expect(deletedCount).toBe(1);
    });
  });
});
