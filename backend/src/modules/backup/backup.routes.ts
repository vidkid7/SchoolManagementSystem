import { Router } from 'express';
import { backupController } from './backup.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { UserRole } from '../../models/User.model';

const router = Router();

/**
 * Backup Routes
 * All routes require School_Admin role
 */

// Create manual backup
router.post(
  '/create',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  (req, res) => backupController.createBackup(req, res)
);

// List available backups
router.get(
  '/list',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  (req, res) => backupController.listBackups(req, res)
);

// Restore from backup
router.post(
  '/restore',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  (req, res) => backupController.restoreBackup(req, res)
);

// Verify backup integrity
router.post(
  '/verify',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  (req, res) => backupController.verifyBackup(req, res)
);

// Clean up old backups
router.post(
  '/cleanup',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  (req, res) => backupController.cleanupBackups(req, res)
);

// Get backup configuration
router.get(
  '/config',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  (req, res) => backupController.getConfig(req, res)
);

export default router;
