import { Router } from 'express';
import { authenticate, authorize } from '@middleware/auth';
import { validate } from '@middleware/validation';
import { UserRole } from '@models/User.model';
import municipalityAdminController from './municipalityAdmin.controller';
import {
  createSchoolAdminSchema,
  createSchoolSchema,
  listIncidentsQuerySchema,
  listSchoolsQuerySchema,
  listUsersQuerySchema,
  schoolIdParamSchema,
  updateSchoolSchema,
} from './municipalityAdmin.validation';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.MUNICIPALITY_ADMIN));

router.get('/dashboard', municipalityAdminController.getDashboard);
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
  '/schools/:schoolId/admins',
  validate(schoolIdParamSchema, 'params'),
  validate(createSchoolAdminSchema),
  municipalityAdminController.createSchoolAdmin
);

export default router;
