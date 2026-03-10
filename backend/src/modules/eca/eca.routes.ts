import { Router } from 'express';
import ecaController from './eca.controller';
import { authenticate, authorize } from '@middleware/auth';
import { UserRole } from '@models/User.model';
import {
  createECAValidation,
  updateECAValidation,
  getECAByIdValidation,
  deleteECAValidation,
  getECAsValidation,
  enrollStudentValidation,
  markAttendanceValidation,
  createEventValidation,
  recordAchievementValidation,
  getStudentECAHistoryValidation
} from './eca.validation';

/**
 * ECA API Routes
 * 
 * Requirements: 11.1-11.10
 */

const router = Router();

router.use(authenticate);

const readRoles = [
  UserRole.SCHOOL_ADMIN,
  UserRole.CLASS_TEACHER,
  UserRole.SUBJECT_TEACHER,
  UserRole.DEPARTMENT_HEAD,
  UserRole.ECA_COORDINATOR,
  UserRole.STUDENT,
  UserRole.PARENT
];

const manageRoles = [
  UserRole.SCHOOL_ADMIN,
  UserRole.ECA_COORDINATOR
];

/**
 * @route   GET /api/v1/eca/statistics
 * @desc    Get ECA dashboard statistics
 * @access  Private (School_Admin, ECA_Coordinator)
 */
router.get(
  '/statistics',
  authorize(UserRole.SCHOOL_ADMIN, UserRole.ECA_COORDINATOR, UserRole.DEPARTMENT_HEAD),
  ecaController.getStatistics
);

/**
 * @route   GET /api/v1/eca/recent-activities
 * @desc    Get recent ECA activities
 * @access  Private (School_Admin, ECA_Coordinator)
 */
router.get(
  '/recent-activities',
  authorize(UserRole.SCHOOL_ADMIN, UserRole.ECA_COORDINATOR, UserRole.DEPARTMENT_HEAD),
  ecaController.getRecentActivities
);

/**
 * @route   GET /api/v1/eca/enrollments
 * @desc    List all ECA enrollments
 * @access  Private (ECA Coordinator, Admin)
 */
router.get(
  '/enrollments',
  authorize(...manageRoles),
  ecaController.getEnrollments
);

/**
 * @route   POST /api/v1/eca/enrollments
 * @desc    Enroll a student in an ECA
 * @access  Private (ECA Coordinator, Admin)
 */
router.post(
  '/enrollments',
  authorize(...manageRoles),
  ecaController.createEnrollment
);

/**
 * @route   GET /api/v1/eca/attendance
 * @desc    Get ECA attendance records
 * @access  Private (ECA Coordinator, Admin)
 */
router.get(
  '/attendance',
  authorize(...manageRoles),
  ecaController.getAttendanceRecords
);

/**
 * @route   POST /api/v1/eca/attendance
 * @desc    Mark attendance for an ECA session
 * @access  Private (ECA Coordinator, Admin)
 */
router.post(
  '/attendance',
  authorize(...manageRoles),
  ecaController.markAttendanceFlat
);

/**
 * @route   GET /api/v1/eca/achievements
 * @desc    List all ECA achievements
 * @access  Private (ECA Coordinator, Admin)
 */
router.get(
  '/achievements',
  authorize(...manageRoles),
  ecaController.getAchievements
);

/**
 * @route   POST /api/v1/eca/achievements
 * @desc    Record an ECA achievement
 * @access  Private (ECA Coordinator, Admin)
 */
router.post(
  '/achievements',
  authorize(...manageRoles),
  ecaController.createAchievement
);

/**
 * @route   GET /api/v1/eca
 * @route   GET /api/v1/eca/list (alias for frontend)
 * @desc    List ECAs with filters and pagination
 * @access  Private (All authenticated)
 */
router.get(
  '/',
  authorize(...readRoles),
  getECAsValidation,
  ecaController.getECAs
);
router.get(
  '/list',
  authorize(...readRoles),
  getECAsValidation,
  ecaController.getECAs
);

/**
 * @route   POST /api/v1/eca
 * @desc    Create a new ECA
 * @access  Private (ECA Coordinator, Admin)
 */
router.post(
  '/',
  authorize(...manageRoles),
  createECAValidation,
  ecaController.createECA
);

/**
 * @route   GET /api/v1/eca/events
 * @desc    Get ECA events with filters
 * @access  Private (All authenticated)
 */
router.get(
  '/events',
  authorize(...readRoles),
  ecaController.getEvents
);

/**
 * @route   POST /api/v1/eca/events
 * @desc    Create a new ECA event
 * @access  Private (ECA Coordinator, Admin)
 */
router.post(
  '/events',
  authorize(...manageRoles),
  createEventValidation,
  ecaController.createEvent
);

/**
 * @route   GET /api/v1/eca/student/:studentId
 * @desc    Get student ECA history
 * @access  Private (All authenticated)
 */
router.get(
  '/student/:studentId',
  authorize(...readRoles),
  getStudentECAHistoryValidation,
  ecaController.getStudentECAHistory
);

/**
 * @route   GET /api/v1/eca/:ecaId
 * @desc    Get ECA details by ID
 * @access  Private (All authenticated)
 */
router.get(
  '/:ecaId',
  authorize(...readRoles),
  getECAByIdValidation,
  ecaController.getECAById
);

/**
 * @route   PUT /api/v1/eca/:ecaId
 * @desc    Update ECA
 * @access  Private (ECA Coordinator, Admin)
 */
router.put(
  '/:ecaId',
  authorize(...manageRoles),
  updateECAValidation,
  ecaController.updateECA
);

/**
 * @route   DELETE /api/v1/eca/:ecaId
 * @desc    Delete ECA (soft delete)
 * @access  Private (Admin)
 */
router.delete(
  '/:ecaId',
  authorize(UserRole.SCHOOL_ADMIN),
  deleteECAValidation,
  ecaController.deleteECA
);

/**
 * @route   POST /api/v1/eca/:ecaId/enroll
 * @desc    Enroll student in ECA
 * @access  Private (ECA Coordinator, Admin)
 */
router.post(
  '/:ecaId/enroll',
  authorize(...manageRoles),
  enrollStudentValidation,
  ecaController.enrollStudent
);

/**
 * @route   POST /api/v1/eca/:ecaId/mark-attendance
 * @desc    Mark attendance for ECA session
 * @access  Private (ECA Coordinator, Admin)
 */
router.post(
  '/:ecaId/mark-attendance',
  authorize(...manageRoles),
  markAttendanceValidation,
  ecaController.markAttendance
);

/**
 * @route   POST /api/v1/eca/:ecaId/record-achievement
 * @desc    Record student achievement in ECA
 * @access  Private (ECA Coordinator, Admin)
 */
router.post(
  '/:ecaId/record-achievement',
  authorize(...manageRoles),
  recordAchievementValidation,
  ecaController.recordAchievement
);

export default router;
