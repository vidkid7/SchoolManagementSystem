import { Router } from 'express';
import nonTeachingStaffController from './nonTeachingStaff.controller';
import { authenticate, authorize } from '@middleware/auth';
import { UserRole } from '@models/User.model';
import { validate } from '@middleware/validation';
import {
  staffLeaveRequestIdSchema,
  staffLeaveRequestSchema,
  staffScheduleQuerySchema,
  staffScheduleSchema,
  staffTaskIdSchema,
  staffTaskQuerySchema,
  staffTaskSchema,
  staffTaskStatusSchema,
} from './nonTeachingStaff.validation';

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
router.get('/tasks', authorize(UserRole.NON_TEACHING_STAFF), validate(staffTaskQuerySchema, 'query'), nonTeachingStaffController.getTasks);
router.put('/tasks/:taskId', authorize(UserRole.NON_TEACHING_STAFF, UserRole.SCHOOL_ADMIN), validate(staffTaskIdSchema, 'params'), validate(staffTaskStatusSchema, 'body'), nonTeachingStaffController.updateTaskStatus);

router.get('/leave', authorize(UserRole.NON_TEACHING_STAFF), nonTeachingStaffController.getMyLeaveRequests);
router.post('/leave', authorize(UserRole.NON_TEACHING_STAFF), validate(staffLeaveRequestSchema, 'body'), nonTeachingStaffController.applyForLeave);
router.delete('/leave/:requestId', authorize(UserRole.NON_TEACHING_STAFF), validate(staffLeaveRequestIdSchema, 'params'), nonTeachingStaffController.cancelLeaveRequest);

// Admin can manage all tasks
router.get('/tasks/all', authorize(UserRole.SCHOOL_ADMIN), nonTeachingStaffController.getAllTasks);
router.post('/tasks', authorize(UserRole.SCHOOL_ADMIN), validate(staffTaskSchema), nonTeachingStaffController.createTask);

// Work schedule
router.get('/schedule', authorize(UserRole.NON_TEACHING_STAFF, UserRole.SCHOOL_ADMIN), validate(staffScheduleQuerySchema, 'query'), nonTeachingStaffController.getSchedule);
router.post('/schedule', authorize(UserRole.SCHOOL_ADMIN), validate(staffScheduleSchema), nonTeachingStaffController.setSchedule);

export default router;
