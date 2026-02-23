import { Router } from 'express';
import systemSettingsController from './systemSettings.controller';
import { authenticate, authorize } from '@middleware/auth';
import { UserRole } from '@models/User.model';
import { validate } from '@middleware/validation';
import {
  createGradingSchemeSchema,
  updateGradingSchemeSchema,
  createAttendanceRuleSchema,
  updateAttendanceRuleSchema,
  createNotificationTemplateSchema,
  updateNotificationTemplateSchema,
  updateDateFormatSettingsSchema,
} from './systemSettings.validation';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize(UserRole.SCHOOL_ADMIN));

// ==================== Grading Schemes ====================
router.get('/grading-schemes', systemSettingsController.getGradingSchemes);
router.get('/grading-schemes/default', systemSettingsController.getDefaultGradingScheme);
router.get('/grading-schemes/:id', systemSettingsController.getGradingSchemeById);
router.post(
  '/grading-schemes',
  validate(createGradingSchemeSchema),
  systemSettingsController.createGradingScheme
);
router.put(
  '/grading-schemes/:id',
  validate(updateGradingSchemeSchema),
  systemSettingsController.updateGradingScheme
);
router.delete('/grading-schemes/:id', systemSettingsController.deleteGradingScheme);

// ==================== Attendance Rules ====================
router.get('/attendance-rules', systemSettingsController.getAttendanceRules);
router.get('/attendance-rules/active', systemSettingsController.getActiveAttendanceRule);
router.get('/attendance-rules/:id', systemSettingsController.getAttendanceRuleById);
router.post(
  '/attendance-rules',
  validate(createAttendanceRuleSchema),
  systemSettingsController.createAttendanceRule
);
router.put(
  '/attendance-rules/:id',
  validate(updateAttendanceRuleSchema),
  systemSettingsController.updateAttendanceRule
);
router.delete('/attendance-rules/:id', systemSettingsController.deleteAttendanceRule);

// ==================== Notification Templates ====================
router.get('/notification-templates', systemSettingsController.getNotificationTemplates);
router.get('/notification-templates/code/:code', systemSettingsController.getNotificationTemplateByCode);
router.get('/notification-templates/:id', systemSettingsController.getNotificationTemplateById);
router.post(
  '/notification-templates',
  validate(createNotificationTemplateSchema),
  systemSettingsController.createNotificationTemplate
);
router.put(
  '/notification-templates/:id',
  validate(updateNotificationTemplateSchema),
  systemSettingsController.updateNotificationTemplate
);
router.delete('/notification-templates/:id', systemSettingsController.deleteNotificationTemplate);

// ==================== Date Format Settings ====================
router.get('/date-format', systemSettingsController.getDateFormatSettings);
router.put(
  '/date-format',
  validate(updateDateFormatSettingsSchema),
  systemSettingsController.updateDateFormatSettings
);

export default router;
