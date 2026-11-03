import { Router } from 'express';
import { backupController } from './backup.controller';
import { authenticate } from '../../middleware/auth';
import { authorizeBackupAccess } from '../../middleware/systemAccount';
import { requireSystemAccount } from '../../middleware/systemAccount';
import { validate } from '../../middleware/validation';
import { schoolBackupPassphraseSchema, schoolIdParamSchema } from '../config/municipalityAdmin.validation';
import multer from 'multer';

const router = Router();
const schoolBackupUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024, files: 1 },
});

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

// Per-school encrypted backup operations. These endpoints are restricted to Devuser.
router.post(
  '/platform/schools/:schoolId/create',
  authenticate,
  requireSystemAccount,
  validate(schoolIdParamSchema, 'params'),
  validate(schoolBackupPassphraseSchema, 'body'),
  (req, res) => backupController.createSchoolBackup(req, res)
);
router.post(
  '/platform/schools/:schoolId/verify',
  authenticate,
  requireSystemAccount,
  validate(schoolIdParamSchema, 'params'),
  schoolBackupUpload.single('backup'),
  (req, res) => backupController.verifySchoolBackup(req, res)
);
router.post(
  '/platform/schools/:schoolId/restore',
  authenticate,
  requireSystemAccount,
  validate(schoolIdParamSchema, 'params'),
  schoolBackupUpload.single('backup'),
  (req, res) => backupController.restoreSchoolBackup(req, res)
);

export default router;
