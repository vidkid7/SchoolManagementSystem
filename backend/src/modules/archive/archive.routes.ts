import { Router } from 'express';
import archiveController from './archive.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import {
  archiveAcademicYearSchema,
  archiveIdSchema,
  getArchivesSchema,
} from './archive.validation';

const router = Router();

// All routes require authentication and school_admin role
router.use(authenticate);
router.use(authorize(['school_admin']));

// Archive academic year
router.post(
  '/academic-year',
  validate(archiveAcademicYearSchema),
  archiveController.archiveAcademicYear
);

// Restore archived data
router.post(
  '/:archiveId/restore',
  validate(archiveIdSchema, 'params'),
  archiveController.restoreArchivedData
);

// Get list of archives
router.get('/', validate(getArchivesSchema, 'query'), archiveController.getArchives);

// Get archive details
router.get(
  '/:archiveId',
  validate(archiveIdSchema, 'params'),
  archiveController.getArchiveById
);

// Delete expired archives
router.post('/cleanup', archiveController.deleteExpiredArchives);

export default router;
