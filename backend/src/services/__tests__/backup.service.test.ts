import { BackupService } from '../backup.service';
import fs from 'fs/promises';
import { exec } from 'child_process';
import path from 'path';

// Mock dependencies
jest.mock('fs/promises');
jest.mock('child_process');
jest.mock('../../utils/logger');

describe('BackupService', () => {
  let backupService: BackupService;
  const mockBackupPath = '/tmp/test-backups';
  const mockExternalPath = '/tmp/external-backups';

  beforeEach(() => {
    // Set environment variables for testing
    process.env.BACKUP_ENABLED = 'true';
    process.env.BACKUP_SCHEDULE = '0 2 * * *';
    process.env.BACKUP_RETENTION_DAYS = '30';
    process.env.BACKUP_PATH = mockBackupPath;
    process.env.BACKUP_EXTERNAL_PATH = mockExternalPath;
    process.env.BACKUP_COMPRESSION = 'true';

    backupService = new BackupService();

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.BACKUP_ENABLED;
    delete process.env.BACKUP_SCHEDULE;
    delete process.env.BACKUP_RETENTION_DAYS;
    delete process.env.BACKUP_PATH;
    delete process.env.BACKUP_EXTERNAL_PATH;
    delete process.env.BACKUP_COMPRESSION;
  });

  describe('initialize', () => {
    it('should create backup directories', async () => {
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);

      await backupService.initialize();

      expect(fs.mkdir).toHaveBeenCalledWith(mockBackupPath, { recursive: true });
      expect(fs.mkdir).toHaveBeenCalledWith(mockExternalPath, { recursive: true });
    });

    it('should handle directory creation errors', async () => {
      const error = new Error('Permission denied');
      (fs.mkdir as jest.Mock).mockRejectedValue(error);

      await expect(backupService.initialize()).rejects.toThrow('Permission denied');
    });

    it('should only create local directory if external path not configured', async () => {
      delete process.env.BACKUP_EXTERNAL_PATH;
      backupService = new BackupService();
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);

      await backupService.initialize();

      expect(fs.mkdir).toHaveBeenCalledTimes(1);
      expect(fs.mkdir).toHaveBeenCalledWith(mockBackupPath, { recursive: true });
    });
  });

  describe('createBackup', () => {
    it('should create a database backup successfully', async () => {
      const mockExec = exec as unknown as jest.Mock;
      mockExec.mockImplementation((_cmd, callback) => {
        callback(null, { stdout: '', stderr: '' });
      });

      (fs.stat as jest.Mock).mockResolvedValue({ size: 1024000 });
      (fs.unlink as jest.Mock).mockResolvedValue(undefined);
      (fs.copyFile as jest.Mock).mockResolvedValue(undefined);

      const result = await backupService.createBackup();

      expect(result.success).toBe(true);
      expect(result.filename).toMatch(/^backup_.*\.sql\.gz$/);
      expect(result.size).toBeGreaterThan(0);
    });

    it('should handle backup creation errors', async () => {
      const mockExec = exec as unknown as jest.Mock;
      mockExec.mockImplementation((_cmd, callback) => {
        callback(new Error('mysqldump failed'), null);
      });

      const result = await backupService.createBackup();

      expect(result.success).toBe(false);
      expect(result.error).toBe('mysqldump failed');
    });

    it('should create uncompressed backup when compression is disabled', async () => {
      process.env.BACKUP_COMPRESSION = 'false';
      backupService = new BackupService();

      const mockExec = exec as unknown as jest.Mock;
      mockExec.mockImplementation((_cmd, callback) => {
        callback(null, { stdout: '', stderr: '' });
      });

      (fs.stat as jest.Mock).mockResolvedValue({ size: 1024000 });
      (fs.copyFile as jest.Mock).mockResolvedValue(undefined);

      const result = await backupService.createBackup();

      expect(result.success).toBe(true);
      expect(result.filename).toMatch(/^backup_.*\.sql$/);
      expect(fs.unlink).not.toHaveBeenCalled();
    });
  });

  describe('listBackups', () => {
    it('should list all available backups', async () => {
      const mockFiles = [
        'backup_2024-01-01T00-00-00.sql.gz',
        'backup_2024-01-02T00-00-00.sql.gz',
        'other-file.txt',
      ];

      (fs.readdir as jest.Mock).mockResolvedValue(mockFiles);
      (fs.stat as jest.Mock).mockResolvedValue({
        size: 1024000,
        mtime: new Date('2024-01-01'),
      });

      const backups = await backupService.listBackups();

      expect(backups).toHaveLength(2);
      expect(backups[0].filename).toMatch(/^backup_.*\.sql\.gz$/);
      expect(backups[0].compressed).toBe(true);
      expect(backups[0].location).toBe('local');
    });

    it('should handle empty backup directory', async () => {
      (fs.readdir as jest.Mock).mockResolvedValue([]);

      const backups = await backupService.listBackups();

      expect(backups).toHaveLength(0);
    });

    it('should merge local and external backups', async () => {
      const mockLocalFiles = ['backup_2024-01-01T00-00-00.sql.gz'];
      const mockExternalFiles = [
        'backup_2024-01-01T00-00-00.sql.gz',
        'backup_2024-01-02T00-00-00.sql.gz',
      ];

      (fs.readdir as jest.Mock)
        .mockResolvedValueOnce(mockLocalFiles)
        .mockResolvedValueOnce(mockExternalFiles);

      (fs.stat as jest.Mock).mockResolvedValue({
        size: 1024000,
        mtime: new Date('2024-01-01'),
      });

      const backups = await backupService.listBackups();

      expect(backups).toHaveLength(2);
      expect(backups.find(b => b.filename === mockLocalFiles[0])?.location).toBe('both');
      expect(backups.find(b => b.filename === mockExternalFiles[1])?.location).toBe('external');
    });
  });

  describe('cleanupOldBackups', () => {
    it('should delete backups older than retention period', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 31); // 31 days old

      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 15); // 15 days old

      const mockFiles = [
        'backup_old.sql.gz',
        'backup_recent.sql.gz',
      ];

      (fs.readdir as jest.Mock).mockResolvedValue(mockFiles);
      (fs.stat as jest.Mock)
        .mockResolvedValueOnce({ size: 1024000, mtime: oldDate })
        .mockResolvedValueOnce({ size: 1024000, mtime: recentDate });

      (fs.unlink as jest.Mock).mockResolvedValue(undefined);

      const deletedCount = await backupService.cleanupOldBackups();

      expect(deletedCount).toBe(1);
      expect(fs.unlink).toHaveBeenCalledWith(
        path.join(mockBackupPath, 'backup_old.sql.gz')
      );
    });

    it('should handle cleanup errors gracefully', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 31);

      (fs.readdir as jest.Mock).mockResolvedValue(['backup_old.sql.gz']);
      (fs.stat as jest.Mock).mockResolvedValue({ size: 1024000, mtime: oldDate });
      (fs.unlink as jest.Mock).mockRejectedValue(new Error('Permission denied'));

      const deletedCount = await backupService.cleanupOldBackups();

      expect(deletedCount).toBe(0);
    });
  });

  describe('verifyBackup', () => {
    it('should verify a valid backup file', async () => {
      const filename = 'backup_2024-01-01T00-00-00.sql.gz';

      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.open as jest.Mock).mockResolvedValue({
        read: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
      });

      // Mock gzip header
      (fs.open as jest.Mock).mockResolvedValue({
        read: jest.fn().mockImplementation((buf) => {
          buf[0] = 0x1f;
          buf[1] = 0x8b;
          return Promise.resolve();
        }),
        close: jest.fn().mockResolvedValue(undefined),
      });

      const isValid = await backupService.verifyBackup(filename);

      expect(isValid).toBe(true);
    });

    it('should detect invalid gzip files', async () => {
      const filename = 'backup_2024-01-01T00-00-00.sql.gz';

      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.open as jest.Mock).mockResolvedValue({
        read: jest.fn().mockImplementation((buf) => {
          buf[0] = 0x00;
          buf[1] = 0x00;
          return Promise.resolve();
        }),
        close: jest.fn().mockResolvedValue(undefined),
      });

      const isValid = await backupService.verifyBackup(filename);

      expect(isValid).toBe(false);
    });

    it('should handle missing backup files', async () => {
      const filename = 'nonexistent.sql.gz';

      (fs.access as jest.Mock).mockRejectedValue(new Error('File not found'));

      const isValid = await backupService.verifyBackup(filename);

      expect(isValid).toBe(false);
    });
  });

  describe('getConfig', () => {
    it('should return backup configuration', () => {
      const config = backupService.getConfig();

      expect(config.enabled).toBe(true);
      expect(config.schedule).toBe('0 2 * * *');
      expect(config.retentionDays).toBe(30);
      expect(config.backupPath).toBe(mockBackupPath);
      expect(config.externalStoragePath).toBe(mockExternalPath);
      expect(config.compressionEnabled).toBe(true);
    });
  });

  describe('restoreBackup', () => {
    it('should restore database from backup', async () => {
      const filename = 'backup_2024-01-01T00-00-00.sql.gz';

      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const mockExec = exec as unknown as jest.Mock;
      mockExec.mockImplementation((_cmd, callback) => {
        callback(null, { stdout: '', stderr: '' });
      });

      // Mock decompression
      (fs.unlink as jest.Mock).mockResolvedValue(undefined);

      const result = await backupService.restoreBackup(filename);

      expect(result.success).toBe(true);
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should handle restore errors', async () => {
      const filename = 'backup_2024-01-01T00-00-00.sql.gz';

      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const mockExec = exec as unknown as jest.Mock;
      mockExec.mockImplementation((_cmd, callback) => {
        callback(new Error('mysql restore failed'), null);
      });

      const result = await backupService.restoreBackup(filename);

      expect(result.success).toBe(false);
      expect(result.error).toBe('mysql restore failed');
    });

    it('should handle missing backup file', async () => {
      const filename = 'nonexistent.sql.gz';

      (fs.access as jest.Mock).mockRejectedValue(new Error('File not found'));

      const result = await backupService.restoreBackup(filename);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });
});
