import { Router } from 'express';
import hostelController from './hostel.controller';
import { authenticate, authorize } from '@middleware/auth';
import { UserRole } from '@models/User.model';

const router = Router();

router.use(authenticate);

router.get(
  '/dashboard',
  authorize(UserRole.HOSTEL_WARDEN, UserRole.SCHOOL_ADMIN),
  hostelController.getDashboard
);

router.get(
  '/profile',
  authorize(UserRole.HOSTEL_WARDEN),
  hostelController.getProfile
);

router.get(
  '/residents',
  authorize(UserRole.HOSTEL_WARDEN, UserRole.SCHOOL_ADMIN),
  hostelController.getResidentStudents
);

export default router;
