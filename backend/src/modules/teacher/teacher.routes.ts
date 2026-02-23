import { Router } from 'express';
import { authenticate, authorize } from '@middleware/auth';
import { UserRole } from '@models/User.model';
import * as teacherController from './teacher.controller';

const router = Router();

router.use(authenticate);

const TEACHER_ROLES = [
  UserRole.SCHOOL_ADMIN,
  UserRole.CLASS_TEACHER,
  UserRole.SUBJECT_TEACHER,
  UserRole.DEPARTMENT_HEAD,
];

router.get(
  '/dashboard',
  authorize(...TEACHER_ROLES),
  teacherController.getDashboard
);

router.get(
  '/schedule/today',
  authorize(...TEACHER_ROLES),
  teacherController.getTodaySchedule
);

router.get(
  '/tasks/pending',
  authorize(...TEACHER_ROLES),
  teacherController.getPendingTasks
);

router.get(
  '/classes/performance',
  authorize(...TEACHER_ROLES),
  teacherController.getClassPerformance
);

router.get(
  '/stats',
  authorize(...TEACHER_ROLES),
  teacherController.getStats
);

router.get(
  '/notifications',
  authorize(...TEACHER_ROLES),
  teacherController.getNotifications
);

export default router;
