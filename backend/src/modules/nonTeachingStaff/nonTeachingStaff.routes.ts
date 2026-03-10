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

// Task management - staff can view their own tasks
router.get('/tasks', authorize(UserRole.NON_TEACHING_STAFF), nonTeachingStaffController.getTasks);
router.put('/tasks/:taskId', authorize(UserRole.NON_TEACHING_STAFF, UserRole.SCHOOL_ADMIN), nonTeachingStaffController.updateTaskStatus);

// Admin can manage all tasks
router.get('/tasks/all', authorize(UserRole.SCHOOL_ADMIN), nonTeachingStaffController.getAllTasks);
router.post('/tasks', authorize(UserRole.SCHOOL_ADMIN), nonTeachingStaffController.createTask);

// Work schedule
router.get('/schedule', authorize(UserRole.NON_TEACHING_STAFF, UserRole.SCHOOL_ADMIN), nonTeachingStaffController.getSchedule);
router.post('/schedule', authorize(UserRole.SCHOOL_ADMIN), nonTeachingStaffController.setSchedule);

export default router;
