import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { env } from '../config/env';
import logger from '../utils/logger';
import { createGzip, createGunzip } from 'zlib';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

const execAsync = promisify(exec);

interface BackupConfig {
  enabled: boolean;
  schedule: string; // Cron expression
  retentionDays: number;
  backupPath: string;
  externalStoragePath?: string;
  compressionEnabled: boolean;
}

interface BackupMetadata {
  filename: string;
  timestamp: Date;
  size: number;
  compressed: boolean;
  location: 'local' | 'external' | 'both';
  checksum?: string;
}

interface BackupResult {
  success: boolean;
  filename: string;
  path: string;
  size: number;
  duration: number;
  error?: string;
}

interface RestoreResult {
  success: boolean;
  restoredTables: number;
  duration: number;
  error?: string;
}

/**
 * Backup Service
 * Handles automated database backups, external storage, and recovery procedures
 */
export class BackupService {
  private config: BackupConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): BackupConfig {
    return {
      enabled: this.parseBoolean(process.env.BACKUP_ENABLED, env.BACKUP_ENABLED),
      schedule: process.env.BACKUP_SCHEDULE || env.BACKUP_SCHEDULE,
      retentionDays: this.parseNumber(process.env.BACKUP_RETENTION_DAYS, env.BACKUP_RETENTION_DAYS),
      backupPath: process.env.BACKUP_PATH || env.BACKUP_PATH,
      externalStoragePath: process.env.BACKUP_EXTERNAL_PATH || env.BACKUP_EXTERNAL_PATH,
      compressionEnabled: this.parseBoolean(process.env.BACKUP_COMPRESSION, env.BACKUP_COMPRESSION),
    };
  }

  private parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true';
  }

  private parseNumber(value: string | undefined, defaultValue: number): number {
    if (value === undefined) return defaultValue;
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : defaultValue;
  }

  private shellQuote(value: string | number): string {
    const text = String(value);
    if (process.platform === 'win32') {
      return `"${text.replace(/"/g, '\\"')}"`;
    }

    return `'${text.replace(/'/g, `'\\''`)}'`;
  }

  private isPermissionError(error: unknown): error is NodeJS.ErrnoException {
    return (
      error instanceof Error &&
      'code' in error &&
      (error.code === 'EACCES' || error.code === 'EPERM' || error.code === 'EROFS')
    );
  }

  private async ensureLocalBackupDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.config.backupPath, { recursive: true });
      logger.info('Backup directory initialized', { path: this.config.backupPath });
    } catch (error) {
      if (!this.isPermissionError(error)) {
        throw error;
      }

      const fallbackPath = path.join(os.tmpdir(), 'school-management-system-backups');
      logger.warn('Primary backup path is not writable, using temporary backup directory instead', {
        requestedPath: this.config.backupPath,
        fallbackPath,
        error
      });

      this.config.backupPath = fallbackPath;
      await fs.mkdir(this.config.backupPath, { recursive: true });
      logger.info('Fallback backup directory initialized', { path: this.config.backupPath });
    }
  }

  /**
   * Initialize backup service
   * Creates necessary directories
   */
  async initialize(): Promise<void> {
    try {
      await this.ensureLocalBackupDirectory();

      // Create external storage directory if configured
      if (this.config.externalStoragePath) {
        await fs.mkdir(this.config.externalStoragePath, { recursive: true });
        logger.info('External backup directory initialized', { 
          path: this.config.externalStoragePath 
        });
      }
    } catch (error) {
      logger.error('Failed to initialize backup directories', { error });
      throw error;
    }
  }

  /**
   * Create database backup
   * Exports MySQL database to SQL file
   */
  async createBackup(): Promise<BackupResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_${timestamp}.sql`;
    const backupFilePath = path.join(this.config.backupPath, filename);

    try {
      logger.info('Starting database backup', { filename });

      // Build mysqldump command
      const dumpCommand = this.buildMysqldumpCommand(backupFilePath);

      // Execute backup
      await execAsync(dumpCommand);

      // Get file size
      const stats = await fs.stat(backupFilePath);
      const size = stats.size;

      logger.info('Database backup created', { 
        filename, 
        size: this.formatBytes(size) 
      });

      // Compress if enabled
      let finalPath = backupFilePath;
      let finalSize = size;
      if (this.config.compressionEnabled) {
        const compressedPath = await this.compressBackup(backupFilePath);
        finalPath = compressedPath;
        const compressedStats = await fs.stat(compressedPath);
        finalSize = compressedStats.size;
        
        // Delete uncompressed file
        await fs.unlink(backupFilePath);
        
        logger.info('Backup compressed', { 
          originalSize: this.formatBytes(size),
          compressedSize: this.formatBytes(finalSize),
          ratio: ((1 - finalSize / size) * 100).toFixed(2) + '%'
        });
      }

      // Copy to external storage if configured
      if (this.config.externalStoragePath) {
        await this.copyToExternalStorage(finalPath);
      }

      const duration = Date.now() - startTime;

      return {
        success: true,
        filename: path.basename(finalPath),
        path: finalPath,
        size: finalSize,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Database backup failed', { error, filename });

      return {
        success: false,
        filename,
        path: backupFilePath,
        size: 0,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Build mysqldump command
   */
  private buildMysqldumpCommand(outputPath: string): string {
    const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = env;

    // Build command with proper escaping
    const parts = [
      'mysqldump',
      '--host=' + this.shellQuote(DB_HOST),
      '--port=' + this.shellQuote(DB_PORT),
      '--user=' + this.shellQuote(DB_USER),
    ];

    if (DB_PASSWORD) {
      parts.push('--password=' + this.shellQuote(DB_PASSWORD));
    }

    parts.push(
      '--single-transaction', // Consistent snapshot without locking
      '--routines', // Include stored procedures
      '--triggers', // Include triggers
      '--events', // Include events
      '--add-drop-table', // Add DROP TABLE before CREATE
      '--complete-insert', // Use complete INSERT statements
      '--extended-insert', // Use multi-row INSERT
      '--set-gtid-purged=OFF', // Keep restores portable across GTID-enabled MySQL servers
      '--quick', // Retrieve rows one at a time
      '--lock-tables=false', // Don't lock tables
      this.shellQuote(DB_NAME),
      '>' + this.shellQuote(outputPath)
    );

    return parts.join(' ');
  }

  /**
   * Compress backup file using gzip
   */
  private async compressBackup(filePath: string): Promise<string> {
    const compressedPath = filePath + '.gz';
    const gzip = createGzip({ level: 9 }); // Maximum compression

    await pipeline(
      createReadStream(filePath),
      gzip,
      createWriteStream(compressedPath)
    );

    return compressedPath;
  }

  /**
   * Copy backup to external storage
   */
  private async copyToExternalStorage(sourcePath: string): Promise<void> {
    if (!this.config.externalStoragePath) {
      return;
    }

    try {
      const filename = path.basename(sourcePath);
      const destPath = path.join(this.config.externalStoragePath, filename);

      await fs.copyFile(sourcePath, destPath);

      logger.info('Backup copied to external storage', { 
        source: sourcePath,
        destination: destPath 
      });
    } catch (error) {
      logger.error('Failed to copy backup to external storage', { error });
      // Don't throw - external storage failure shouldn't fail the backup
    }
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(backupFilename: string): Promise<RestoreResult> {
    const startTime = Date.now();

    try {
      logger.info('Starting database restore', { backupFilename });

      // Find backup file
      const backupPath = await this.findBackupFile(backupFilename);
      if (!backupPath) {
        throw new Error(`Backup file not found: ${backupFilename}`);
      }

      // Decompress if needed
      let sqlFilePath = backupPath;
      if (backupPath.endsWith('.gz')) {
        sqlFilePath = await this.decompressBackup(backupPath);
      }

      // Build mysql restore command
      const restoreCommand = this.buildMysqlRestoreCommand(sqlFilePath);

      // Execute restore
      await execAsync(restoreCommand);

      // Clean up decompressed file if it was created
      if (sqlFilePath !== backupPath) {
        await fs.unlink(sqlFilePath);
      }

      const duration = Date.now() - startTime;

      logger.info('Database restore completed', { 
        backupFilename,
        duration: duration + 'ms'
      });

      return {
        success: true,
        restoredTables: 0, // Could be enhanced to count tables
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Database restore failed', { error, backupFilename });

      return {
        success: false,
        restoredTables: 0,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Find backup file in local or external storage
   */
  private async findBackupFile(filename: string): Promise<string | null> {
    // Check local storage
    const localPath = path.join(this.config.backupPath, filename);
    try {
      await fs.access(localPath);
      return localPath;
    } catch {
      // File not in local storage
    }

    // Check external storage
    if (this.config.externalStoragePath) {
      const externalPath = path.join(this.config.externalStoragePath, filename);
      try {
        await fs.access(externalPath);
        return externalPath;
      } catch {
        // File not in external storage
      }
    }

    return null;
  }

  /**
   * Decompress backup file
   */
  private async decompressBackup(compressedPath: string): Promise<string> {
    const decompressedPath = compressedPath.replace(/\.gz$/, '');
    const gunzip = createGunzip();

    await pipeline(
      createReadStream(compressedPath),
      gunzip,
      createWriteStream(decompressedPath)
    );

    return decompressedPath;
  }

  /**
   * Build mysql restore command
   */
  private buildMysqlRestoreCommand(sqlFilePath: string): string {
    const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = env;

    const parts = [
      'mysql',
      '--host=' + this.shellQuote(DB_HOST),
      '--port=' + this.shellQuote(DB_PORT),
      '--user=' + this.shellQuote(DB_USER),
    ];

    if (DB_PASSWORD) {
      parts.push('--password=' + this.shellQuote(DB_PASSWORD));
    }

    parts.push(
      this.shellQuote(DB_NAME),
      '<' + this.shellQuote(sqlFilePath)
    );

    return parts.join(' ');
  }

  /**
   * List available backups
   */
  async listBackups(): Promise<BackupMetadata[]> {
    const backups: BackupMetadata[] = [];

    try {
      // List local backups
      const localFiles = await fs.readdir(this.config.backupPath);
      for (const file of localFiles) {
        if (file.startsWith('backup_') && (file.endsWith('.sql') || file.endsWith('.sql.gz'))) {
          const filePath = path.join(this.config.backupPath, file);
          const stats = await fs.stat(filePath);
          
          backups.push({
            filename: file,
            timestamp: stats.mtime,
            size: stats.size,
            compressed: file.endsWith('.gz'),
            location: 'local',
          });
        }
      }

      // List external backups if configured
      if (this.config.externalStoragePath) {
        try {
          const externalFiles = await fs.readdir(this.config.externalStoragePath);
          for (const file of externalFiles) {
            if (file.startsWith('backup_') && (file.endsWith('.sql') || file.endsWith('.sql.gz'))) {
              // Check if already in local
              const existingBackup = backups.find(b => b.filename === file);
              if (existingBackup) {
                existingBackup.location = 'both';
              } else {
                const filePath = path.join(this.config.externalStoragePath, file);
                const stats = await fs.stat(filePath);
                
                backups.push({
                  filename: file,
                  timestamp: stats.mtime,
                  size: stats.size,
                  compressed: file.endsWith('.gz'),
                  location: 'external',
                });
              }
            }
          }
        } catch (error) {
          logger.warn('Failed to list external backups', { error });
        }
      }

      // Sort by timestamp descending (newest first)
      backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      return backups;
    } catch (error) {
      logger.error('Failed to list backups', { error });
      return [];
    }
  }

  /**
   * Clean up old backups based on retention policy
   */
  async cleanupOldBackups(): Promise<number> {
    try {
      const backups = await this.listBackups();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      let deletedCount = 0;

      for (const backup of backups) {
        if (backup.timestamp < cutoffDate) {
          // Delete from local storage
          if (backup.location === 'local' || backup.location === 'both') {
            const localPath = path.join(this.config.backupPath, backup.filename);
            try {
              await fs.unlink(localPath);
              deletedCount++;
              logger.info('Deleted old backup from local storage', { 
                filename: backup.filename 
              });
            } catch (error) {
              logger.warn('Failed to delete old backup from local storage', { 
                filename: backup.filename,
                error 
              });
            }
          }

          // Delete from external storage
          if (this.config.externalStoragePath && 
              (backup.location === 'external' || backup.location === 'both')) {
            const externalPath = path.join(this.config.externalStoragePath, backup.filename);
            try {
              await fs.unlink(externalPath);
              logger.info('Deleted old backup from external storage', { 
                filename: backup.filename 
              });
            } catch (error) {
              logger.warn('Failed to delete old backup from external storage', { 
                filename: backup.filename,
                error 
              });
            }
          }
        }
      }

      logger.info('Backup cleanup completed', { 
        deletedCount,
        retentionDays: this.config.retentionDays 
      });

      return deletedCount;
    } catch (error) {
      logger.error('Backup cleanup failed', { error });
      return 0;
    }
  }

  /**
   * Verify backup integrity
   */
  async verifyBackup(backupFilename: string): Promise<boolean> {
    try {
      const backupPath = await this.findBackupFile(backupFilename);
      if (!backupPath) {
        logger.error('Backup file not found for verification', { backupFilename });
        return false;
      }

      // Check if file is readable
      await fs.access(backupPath, fs.constants.R_OK);

      // For compressed files, try to read the header
      if (backupPath.endsWith('.gz')) {
        const buffer = Buffer.alloc(2);
        const fd = await fs.open(backupPath, 'r');
        await fd.read(buffer, 0, 2, 0);
        await fd.close();

        // Check gzip magic number (1f 8b)
        if (buffer[0] !== 0x1f || buffer[1] !== 0x8b) {
          logger.error('Invalid gzip file', { backupFilename });
          return false;
        }
      }

      logger.info('Backup verification passed', { backupFilename });
      return true;
    } catch (error) {
      logger.error('Backup verification failed', { backupFilename, error });
      return false;
    }
  }

  /**
   * Get backup configuration
   */
  getConfig(): BackupConfig {
    return { ...this.config };
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

// Export singleton instance
export const backupService = new BackupService();
