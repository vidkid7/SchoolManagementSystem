import { Router } from 'express';
import examScheduleController from './examSchedule.controller';
import { authenticate, authorize } from '@middleware/auth';
import { UserRole } from '@models/User.model';
import {
  createExamScheduleValidation,
  updateExamScheduleValidation,
  getScheduleByIdValidation,
  getSchedulesByDateValidation,
  getSchedulesByDateRangeValidation,
  getSchedulesByInvigilatorValidation,
  getSchedulesByRoomValidation,
  generateClassTimetableValidation,
  generateTeacherTimetableValidation,
  deleteScheduleValidation,
  bulkCreateSchedulesValidation
} from './examSchedule.validation';

const router = Router();

router.use(authenticate);

/**
 * Exam Schedule Routes
 * 
 * Requirements: 7.3, 7.4
 */

const manageRoles = [
  UserRole.SCHOOL_ADMIN,
  UserRole.CLASS_TEACHER
];

const viewRoles = [
  UserRole.SCHOOL_ADMIN,
  UserRole.CLASS_TEACHER,
  UserRole.SUBJECT_TEACHER,
  UserRole.DEPARTMENT_HEAD,
  UserRole.STUDENT,
  UserRole.PARENT
];

router.post(
  '/',
  authorize(...manageRoles),
  createExamScheduleValidation,
  examScheduleController.createSchedule
);

router.post(
  '/bulk',
  authorize(...manageRoles),
  bulkCreateSchedulesValidation,
  examScheduleController.bulkCreateSchedules
);

router.get(
  '/by-date',
  authorize(...viewRoles),
  getSchedulesByDateValidation,
  examScheduleController.getSchedulesByDate
);

router.get(
  '/by-date-range',
  authorize(...viewRoles),
  getSchedulesByDateRangeValidation,
  examScheduleController.getSchedulesByDateRange
);

router.get(
  '/by-invigilator/:teacherId',
  authorize(UserRole.SCHOOL_ADMIN, UserRole.CLASS_TEACHER, UserRole.SUBJECT_TEACHER, UserRole.DEPARTMENT_HEAD),
  getSchedulesByInvigilatorValidation,
  examScheduleController.getSchedulesByInvigilator
);

router.get(
  '/by-room/:roomNumber',
  authorize(UserRole.SCHOOL_ADMIN, UserRole.CLASS_TEACHER, UserRole.DEPARTMENT_HEAD),
  getSchedulesByRoomValidation,
  examScheduleController.getSchedulesByRoom
);

router.get(
  '/timetable/class/:classId',
  authorize(...viewRoles),
  generateClassTimetableValidation,
  examScheduleController.generateClassTimetable
);

router.get(
  '/timetable/teacher/:teacherId',
  authorize(UserRole.SCHOOL_ADMIN, UserRole.CLASS_TEACHER, UserRole.SUBJECT_TEACHER, UserRole.DEPARTMENT_HEAD),
  generateTeacherTimetableValidation,
  examScheduleController.generateTeacherTimetable
);

router.get(
  '/:id',
  authorize(...viewRoles),
  getScheduleByIdValidation,
  examScheduleController.getScheduleById
);

router.put(
  '/:id',
  authorize(...manageRoles),
  updateExamScheduleValidation,
  examScheduleController.updateSchedule
);

router.delete(
  '/:id',
  authorize(UserRole.SCHOOL_ADMIN),
  deleteScheduleValidation,
  examScheduleController.deleteSchedule
);

export default router;
