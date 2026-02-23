import { Router } from 'express';
import transportController from './transport.controller';
import { authenticate, authorize } from '@middleware/auth';
import { UserRole } from '@models/User.model';

const router = Router();

router.use(authenticate);

router.get(
  '/dashboard',
  authorize(UserRole.TRANSPORT_MANAGER, UserRole.SCHOOL_ADMIN),
  transportController.getDashboard
);

router.get(
  '/profile',
  authorize(UserRole.TRANSPORT_MANAGER),
  transportController.getProfile
);

router.get(
  '/students',
  authorize(UserRole.TRANSPORT_MANAGER, UserRole.SCHOOL_ADMIN),
  transportController.getStudentTransportList
);

export default router;
