import { Router } from 'express';
import { backupController } from './backup.controller';
import { authenticate } from '../../middleware/auth';
import { authorizeBackupAccess } from '../../middleware/systemAccount';

const router = Router();

/**
 * Backup Routes
 * Routes require School_Admin or the protected system operator account.
 */

// Create manual backup
router.post(
  '/create',
  authenticate,
  authorizeBackupAccess,
  (req, res) => backupController.createBackup(req, res)
);

// List available backups
router.get(
  '/list',
  authenticate,
  authorizeBackupAccess,
  (req, res) => backupController.listBackups(req, res)
);

// Restore from backup
router.post(
  '/restore',
  authenticate,
  authorizeBackupAccess,
  (req, res) => backupController.restoreBackup(req, res)
);

// Verify backup integrity
router.post(
  '/verify',
  authenticate,
  authorizeBackupAccess,
  (req, res) => backupController.verifyBackup(req, res)
);

// Clean up old backups
router.post(
  '/cleanup',
  authenticate,
  authorizeBackupAccess,
  (req, res) => backupController.cleanupBackups(req, res)
);

// Get backup configuration
router.get(
  '/config',
  authenticate,
  authorizeBackupAccess,
  (req, res) => backupController.getConfig(req, res)
);

export default router;
