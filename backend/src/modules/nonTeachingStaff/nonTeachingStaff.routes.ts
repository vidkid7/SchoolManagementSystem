import { Router } from 'express';
import nonTeachingStaffController from './nonTeachingStaff.controller';
import { authenticate, authorize } from '@middleware/auth';
import { UserRole } from '@models/User.model';

const router = Router();

router.use(authenticate);

router.get(
  '/dashboard',
  authorize(UserRole.NON_TEACHING_STAFF, UserRole.SCHOOL_ADMIN),
  nonTeachingStaffController.getDashboard
);

router.get(
  '/profile',
  authorize(UserRole.NON_TEACHING_STAFF),
  nonTeachingStaffController.getProfile
);

export default router;
