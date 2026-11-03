import { Router } from 'express';
import { authenticate, authorize } from '@middleware/auth';
import { validate } from '@middleware/validation';
import { UserRole } from '@models/User.model';
import { requireSystemAccount } from '@middleware/systemAccount';
import municipalityAdminController from './municipalityAdmin.controller';
import {
  createSchoolAdminSchema,
  createSchoolSchema,
  listIncidentsQuerySchema,
  listSchoolsQuerySchema,
  listUsersQuerySchema,
  municipalityUserIdParamSchema,
  schoolAdminResetParamsSchema,
  schoolIdParamSchema,
  updateSchoolSchema,
} from './municipalityAdmin.validation';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.MUNICIPALITY_ADMIN));

router.get('/dashboard', municipalityAdminController.getDashboard);
router.get('/platform/municipalities', requireSystemAccount, municipalityAdminController.listMunicipalities);
router.get('/reports', municipalityAdminController.getReports);
router.get(
  '/incidents',
  validate(listIncidentsQuerySchema, 'query'),
  municipalityAdminController.listIncidents
);
router.get(
  '/schools',
  validate(listSchoolsQuerySchema, 'query'),
  municipalityAdminController.listSchools
);
router.post('/schools', validate(createSchoolSchema), municipalityAdminController.createSchool);
router.put(
  '/schools/:schoolId',
  validate(schoolIdParamSchema, 'params'),
  validate(updateSchoolSchema),
  municipalityAdminController.updateSchool
);
router.post(
  '/schools/:schoolId/deactivate',
  validate(schoolIdParamSchema, 'params'),
  municipalityAdminController.deactivateSchool
);
router.post(
  '/schools/:schoolId/activate',
  validate(schoolIdParamSchema, 'params'),
  municipalityAdminController.activateSchool
);
router.get('/users', validate(listUsersQuerySchema, 'query'), municipalityAdminController.listUsers);
router.post(
  '/users/:userId/reset-password-link',
  requireSystemAccount,
  validate(municipalityUserIdParamSchema, 'params'),
  municipalityAdminController.issuePasswordResetLink
);
router.get(
  '/platform/schools/:schoolId/admins',
  requireSystemAccount,
  validate(schoolIdParamSchema, 'params'),
  municipalityAdminController.listSchoolAdmins
);
router.post(
  '/platform/schools/:schoolId/admins/:userId/reset-password-link',
  requireSystemAccount,
  validate(schoolAdminResetParamsSchema, 'params'),
  municipalityAdminController.issueSchoolAdminResetLink
);
router.post(
  '/schools/:schoolId/admins',
  validate(schoolIdParamSchema, 'params'),
  validate(createSchoolAdminSchema),
  municipalityAdminController.createSchoolAdmin
);

export default router;
