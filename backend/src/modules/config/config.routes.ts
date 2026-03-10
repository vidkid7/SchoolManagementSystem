import { Router } from 'express';
import multer from 'multer';
import configController from './config.controller';
import { authenticate, authorize } from '@middleware/auth';
import { UserRole } from '@models/User.model';
import { validate } from '@middleware/validation';
import { createSchoolConfigSchema, updateSchoolConfigSchema } from './config.validation';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB for logo
});

// School configuration (mounted at /api/v1/config)
router.get('/school', authenticate, configController.getSchoolConfig);
router.get(
  '/school/:id',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN, UserRole.MUNICIPALITY_ADMIN),
  configController.getSchoolConfigById
);
router.post(
  '/school',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  validate(createSchoolConfigSchema),
  configController.createSchoolConfig
);
router.put(
  '/school',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  configController.updateActiveSchoolConfig
);
router.put(
  '/school/:id',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  validate(updateSchoolConfigSchema),
  configController.updateSchoolConfig
);
router.post(
  '/school/:id/logo',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  upload.single('logo'),
  configController.uploadSchoolLogo
);
router.post(
  '/school/:id/deactivate',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  configController.deactivateSchoolConfig
);

// Attendance rules (legacy)
router.get(
  '/attendance-rules/active',
  authenticate,
  configController.getActiveAttendanceRules
);

router.put(
  '/attendance-rules/:id',
  authenticate,
  configController.updateAttendanceRules
);

router.post(
  '/attendance-rules',
  authenticate,
  configController.createAttendanceRules
);

export default router;
