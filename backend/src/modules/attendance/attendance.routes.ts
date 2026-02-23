import { Router } from 'express';
import attendanceController from './attendance.controller';
import { authenticate, authorize } from '@middleware/auth';
import { validate } from '@middleware/validation';
import { UserRole } from '@models/User.model';
import {
  markAttendanceSchema,
  markAllPresentSchema,
  classAttendanceQuerySchema,
  classIdParamSchema,
  attendanceReportQuerySchema,
  bulkAttendanceSchema,
  syncAttendanceSchema,
  applyLeaveSchema,
  pendingLeavesQuerySchema,
  approveLeaveSchema,
  leaveIdParamSchema,
  staffAttendanceReportQuerySchema,
  markStaffAttendanceSchema,
  bulkStaffAttendanceSchema,
} from './attendance.validation';

const router = Router();

/**
 * Attendance API Routes
 * Requirements: 6.1-6.14
 */

// ==================== Student Attendance ====================

/**
 * @route   POST /api/v1/attendance/student/mark
 * @desc    Mark attendance for a single student
 * @access  Private (School_Admin, Subject_Teacher, Class_Teacher)
 */
router.post(
  '/student/mark',
  authenticate,
  authorize(
    UserRole.SCHOOL_ADMIN,
    UserRole.SUBJECT_TEACHER,
    UserRole.CLASS_TEACHER
  ),
  validate(markAttendanceSchema, 'body'),
  attendanceController.markAttendance
);

/**
 * @route   POST /api/v1/attendance/student/mark-all-present
 * @desc    Mark all students in a class as present (bulk operation)
 * @access  Private (School_Admin, Subject_Teacher, Class_Teacher)
 */
router.post(
  '/student/mark-all-present',
  authenticate,
  authorize(
    UserRole.SCHOOL_ADMIN,
    UserRole.SUBJECT_TEACHER,
    UserRole.CLASS_TEACHER
  ),
  validate(markAllPresentSchema, 'body'),
  attendanceController.markAllPresent
);

/**
 * @route   GET /api/v1/attendance/student/report
 * @desc    Get attendance reports with filters and pagination
 * @access  Private (School_Admin, Subject_Teacher, Class_Teacher, Parent, Student)
 */
router.get(
  '/student/report',
  authenticate,
  authorize(
    UserRole.SCHOOL_ADMIN,
    UserRole.SUBJECT_TEACHER,
    UserRole.CLASS_TEACHER,
    UserRole.PARENT,
    UserRole.STUDENT
  ),
  validate(attendanceReportQuerySchema, 'query'),
  attendanceController.getAttendanceReport
);

/**
 * @route   GET /api/v1/attendance/student/:classId
 * @desc    Get class attendance for a specific date
 * @access  Private (School_Admin, Subject_Teacher, Class_Teacher)
 */
router.get(
  '/student/:classId',
  authenticate,
  authorize(
    UserRole.SCHOOL_ADMIN,
    UserRole.SUBJECT_TEACHER,
    UserRole.CLASS_TEACHER
  ),
  validate(classIdParamSchema, 'params'),
  validate(classAttendanceQuerySchema, 'query'),
  attendanceController.getClassAttendance
);

/**
 * @route   POST /api/v1/attendance/student/bulk
 * @desc    Bulk import attendance from Excel
 * @access  Private (School_Admin, Subject_Teacher, Class_Teacher)
 */
router.post(
  '/student/bulk',
  authenticate,
  authorize(
    UserRole.SCHOOL_ADMIN,
    UserRole.SUBJECT_TEACHER,
    UserRole.CLASS_TEACHER
  ),
  validate(bulkAttendanceSchema, 'body'),
  attendanceController.bulkImportAttendance
);

/**
 * @route   POST /api/v1/attendance/student/sync
 * @desc    Sync offline attendance records
 * @access  Private (School_Admin, Subject_Teacher, Class_Teacher)
 */
router.post(
  '/student/sync',
  authenticate,
  authorize(
    UserRole.SCHOOL_ADMIN,
    UserRole.SUBJECT_TEACHER,
    UserRole.CLASS_TEACHER
  ),
  validate(syncAttendanceSchema, 'body'),
  attendanceController.syncAttendance
);

// ==================== Leave Applications ====================

/**
 * @route   POST /api/v1/attendance/leave/apply
 * @desc    Apply for leave
 * @access  Private (Student, Parent)
 */
router.post(
  '/leave/apply',
  authenticate,
  authorize(UserRole.STUDENT, UserRole.PARENT),
  validate(applyLeaveSchema, 'body'),
  attendanceController.applyForLeave
);

/**
 * @route   GET /api/v1/attendance/leave/pending
 * @desc    Get pending leave applications
 * @access  Private (School_Admin, Class_Teacher)
 */
router.get(
  '/leave/pending',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN, UserRole.CLASS_TEACHER),
  validate(pendingLeavesQuerySchema, 'query'),
  attendanceController.getPendingLeaves
);

/**
 * @route   PUT /api/v1/attendance/leave/:id/approve
 * @desc    Approve or reject leave application
 * @access  Private (School_Admin, Class_Teacher)
 */
router.put(
  '/leave/:id/approve',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN, UserRole.CLASS_TEACHER),
  validate(leaveIdParamSchema, 'params'),
  validate(approveLeaveSchema, 'body'),
  attendanceController.approveOrRejectLeave
);

// ==================== Staff Attendance ====================

/**
 * @route   POST /api/v1/attendance/staff/mark
 * @desc    Mark attendance for a single staff member
 * @access  Private (School_Admin)
 */
router.post(
  '/staff/mark',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  validate(markStaffAttendanceSchema, 'body'),
  attendanceController.markStaffAttendance
);

/**
 * @route   POST /api/v1/attendance/staff/bulk
 * @desc    Mark attendance for multiple staff members (bulk operation)
 * @access  Private (School_Admin)
 */
router.post(
  '/staff/bulk',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  validate(bulkStaffAttendanceSchema, 'body'),
  attendanceController.markBulkStaffAttendance
);

/**
 * @route   GET /api/v1/attendance/staff/report
 * @desc    Get staff attendance reports
 * @access  Private (School_Admin)
 */
router.get(
  '/staff/report',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  validate(staffAttendanceReportQuerySchema, 'query'),
  attendanceController.getStaffAttendanceReport
);

export default router;
