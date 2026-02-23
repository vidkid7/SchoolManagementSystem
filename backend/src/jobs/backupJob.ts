import cron from 'node-cron';
import { backupService } from '../services/backup.service';
import logger from '../utils/logger';

/**
 * Backup Job
 * Schedules automated daily database backups
 */
export class BackupJob {
  private task: cron.ScheduledTask | null = null;

  /**
   * Start the backup job
   */
  async start(): Promise<void> {
    try {
      // Initialize backup service
      await backupService.initialize();

      const config = backupService.getConfig();

      if (!config.enabled) {
        logger.info('Backup job is disabled');
        return;
      }

      // Validate cron expression
      if (!cron.validate(config.schedule)) {
        logger.error('Invalid backup schedule cron expression', { 
          schedule: config.schedule 
        });
        return;
      }

      // Schedule backup job
      this.task = cron.schedule(config.schedule, async () => {
        logger.info('Starting scheduled backup job');
        
        try {
          // Create backup
          const result = await backupService.createBackup();

          if (result.success) {
            logger.info('Scheduled backup completed successfully', {
              filename: result.filename,
              size: result.size,
              duration: result.duration + 'ms',
            });

            // Clean up old backups
            const deletedCount = await backupService.cleanupOldBackups();
            logger.info('Old backups cleaned up', { deletedCount });
          } else {
            logger.error('Scheduled backup failed', {
              error: result.error,
            });
          }
        } catch (error) {
          logger.error('Backup job execution failed', { error });
        }
      });

      logger.info('Backup job scheduled', { 
        schedule: config.schedule,
        retentionDays: config.retentionDays,
        backupPath: config.backupPath,
        externalStoragePath: config.externalStoragePath || 'Not configured',
      });

      // Run initial backup on startup (optional)
      if (process.env.BACKUP_ON_STARTUP === 'true') {
        logger.info('Running initial backup on startup');
        const result = await backupService.createBackup();
        if (result.success) {
          logger.info('Initial backup completed', {
            filename: result.filename,
            size: result.size,
          });
        }
      }
    } catch (error) {
      logger.error('Failed to start backup job', { error });
    }
  }

  /**
   * Stop the backup job
   */
  stop(): void {
    if (this.task) {
      this.task.stop();
      logger.info('Backup job stopped');
    }
  }

  /**
   * Get job status
   */
  getStatus(): { running: boolean; schedule: string } {
    const config = backupService.getConfig();
    return {
      running: this.task !== null && config.enabled,
      schedule: config.schedule,
    };
  }
}

// Export singleton instance
export const backupJob = new BackupJob();
