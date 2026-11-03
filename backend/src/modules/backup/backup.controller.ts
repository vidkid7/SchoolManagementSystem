import { Request, Response } from 'express';
import { backupService } from '../../services/backup.service';
import { backupJob } from '../../jobs/backupJob';
import logger from '../../utils/logger';
import { schoolBackupService } from './schoolBackup.service';
import { runWithTenantContext } from '../../middleware/tenantContext';
import SchoolConfig from '../../models/SchoolConfig.model';
import { UserRole } from '../../models/User.model';
import auditLogger from '../../utils/auditLogger';
import { AuditAction } from '../../models/AuditLog.model';

/**
 * Backup Controller
 * Handles backup management endpoints
 */
export class BackupController {
  private async auditSchoolBackupAction(req: Request, schoolId: string, action: 'created' | 'verified' | 'restored', details: Record<string, unknown>): Promise<void> {
    const school = await SchoolConfig.findByPk(schoolId, { skipTenantIsolation: true } as any);
    if (!school) return;
    await runWithTenantContext({
      userId: req.user!.userId,
      role: UserRole.MUNICIPALITY_ADMIN,
      municipalityId: school.municipalityId,
      schoolConfigIds: [schoolId],
      enforceIsolation: true,
    }, () => auditLogger.log({
      userId: req.user!.userId,
      entityType: 'school_backup',
      entityId: null,
      action: action === 'created' ? AuditAction.CREATE : AuditAction.UPDATE,
      newValue: { action, schoolId, ...details },
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || null,
    }));
  }

  async createSchoolBackup(req: Request, res: Response): Promise<void> {
    const schoolId = req.params.schoolId;
    const passphrase = req.body?.passphrase;
    const result = await schoolBackupService.create(schoolId, passphrase);
    await this.auditSchoolBackupAction(req, schoolId, 'created', { rowCount: result.rowCount, filename: result.filename });
    res.status(200)
      .setHeader('Content-Type', 'application/vnd.school-management-school-backup+json')
      .setHeader('Content-Disposition', `attachment; filename="${result.filename}"`)
      .setHeader('Cache-Control', 'no-store')
      .send(result.file);
  }

  async verifySchoolBackup(req: Request, res: Response): Promise<void> {
    if (!req.file?.buffer) {
      res.status(400).json({ success: false, message: 'A backup file is required.' });
      return;
    }
    const result = await schoolBackupService.verify(req.params.schoolId, req.body?.passphrase, req.file.buffer);
    await this.auditSchoolBackupAction(req, req.params.schoolId, 'verified', { createdAt: result.createdAt, rowCount: result.rowCount });
    res.status(200).json({ success: true, data: result });
  }

  async restoreSchoolBackup(req: Request, res: Response): Promise<void> {
    if (!req.file?.buffer) {
      res.status(400).json({ success: false, message: 'A backup file is required.' });
      return;
    }
    const result = await schoolBackupService.restore(req.params.schoolId, req.body?.passphrase, req.file.buffer);
    await this.auditSchoolBackupAction(req, req.params.schoolId, 'restored', { rowCount: result.rowCount, tableCount: result.tableCount });
    res.status(200).json({ success: true, message: 'School backup records merged successfully.', data: result });
  }

  /**
   * Create manual backup
   * POST /api/v1/backup/create
   */
  async createBackup(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Manual backup requested', { userId: req.user?.userId });

      const result = await backupService.createBackup();

      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Backup created successfully',
          data: {
            filename: result.filename,
            path: result.path,
            size: result.size,
            duration: result.duration,
          },
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'BACKUP_FAILED',
            message: 'Failed to create backup',
            details: result.error,
          },
        });
      }
    } catch (error) {
      logger.error('Backup creation failed', { error });
      res.status(500).json({
        success: false,
        error: {
          code: 'BACKUP_ERROR',
          message: 'An error occurred while creating backup',
        },
      });
    }
  }

  /**
   * List available backups
   * GET /api/v1/backup/list
   */
  async listBackups(_req: Request, res: Response): Promise<void> {
    try {
      const backups = await backupService.listBackups();

      res.status(200).json({
        success: true,
        data: backups,
        meta: {
          total: backups.length,
        },
      });
    } catch (error) {
      logger.error('Failed to list backups', { error });
      res.status(500).json({
        success: false,
        error: {
          code: 'LIST_BACKUPS_ERROR',
          message: 'Failed to list backups',
        },
      });
    }
  }

  /**
   * Restore from backup
   * POST /api/v1/backup/restore
   */
  async restoreBackup(req: Request, res: Response): Promise<void> {
    try {
      const { filename } = req.body;

      if (!filename) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Backup filename is required',
          },
        });
        return;
      }

      logger.info('Backup restore requested', { 
        filename,
        userId: req.user?.userId 
      });

      const result = await backupService.restoreBackup(filename);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Database restored successfully',
          data: {
            restoredTables: result.restoredTables,
            duration: result.duration,
          },
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'RESTORE_FAILED',
            message: 'Failed to restore backup',
            details: result.error,
          },
        });
      }
    } catch (error) {
      logger.error('Backup restore failed', { error });
      res.status(500).json({
        success: false,
        error: {
          code: 'RESTORE_ERROR',
          message: 'An error occurred while restoring backup',
        },
      });
    }
  }

  /**
   * Verify backup integrity
   * POST /api/v1/backup/verify
   */
  async verifyBackup(req: Request, res: Response): Promise<void> {
    try {
      const { filename } = req.body;

      if (!filename) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Backup filename is required',
          },
        });
        return;
      }

      const isValid = await backupService.verifyBackup(filename);

      res.status(200).json({
        success: true,
        data: {
          filename,
          valid: isValid,
        },
      });
    } catch (error) {
      logger.error('Backup verification failed', { error });
      res.status(500).json({
        success: false,
        error: {
          code: 'VERIFY_ERROR',
          message: 'Failed to verify backup',
        },
      });
    }
  }

  /**
   * Clean up old backups
   * POST /api/v1/backup/cleanup
   */
  async cleanupBackups(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Manual backup cleanup requested', { userId: req.user?.userId });

      const deletedCount = await backupService.cleanupOldBackups();

      res.status(200).json({
        success: true,
        message: 'Old backups cleaned up successfully',
        data: {
          deletedCount,
        },
      });
    } catch (error) {
      logger.error('Backup cleanup failed', { error });
      res.status(500).json({
        success: false,
        error: {
          code: 'CLEANUP_ERROR',
          message: 'Failed to clean up old backups',
        },
      });
    }
  }

  /**
   * Get backup configuration
   * GET /api/v1/backup/config
   */
  async getConfig(_req: Request, res: Response): Promise<void> {
    try {
      const config = backupService.getConfig();
      const jobStatus = backupJob.getStatus();

      res.status(200).json({
        success: true,
        data: {
          ...config,
          jobStatus,
        },
      });
    } catch (error) {
      logger.error('Failed to get backup config', { error });
      res.status(500).json({
        success: false,
        error: {
          code: 'CONFIG_ERROR',
          message: 'Failed to get backup configuration',
        },
      });
    }
  }
}

export const backupController = new BackupController();
