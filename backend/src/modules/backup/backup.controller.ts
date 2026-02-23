import { Request, Response } from 'express';
import { backupService } from '../../services/backup.service';
import { backupJob } from '../../jobs/backupJob';
import logger from '../../utils/logger';

/**
 * Backup Controller
 * Handles backup management endpoints
 */
export class BackupController {
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
