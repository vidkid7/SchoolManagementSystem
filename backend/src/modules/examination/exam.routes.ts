import { Router } from 'express';
import examController from './exam.controller';
import { authenticate, authorize } from '@middleware/auth';
import { UserRole } from '@models/User.model';
import {
  createExamValidation,
  updateExamValidation,
  getExamByIdValidation,
  deleteExamValidation,
  getExamsValidation,
  getStudentGradesValidation,
  generateReportCardValidation,
  generateMarkSheetValidation,
  calculateAggregateGPAValidation,
  getExamAnalyticsValidation
} from './exam.validation';
import {
  createExamScheduleValidation,
  getScheduleByIdValidation
} from './examSchedule.validation';
import {
  createGradeEntryValidation,
  bulkGradeEntryValidation
} from './gradeEntry.validation';

/**
 * Examination API Routes
 * 
 * Requirements: 7.1-7.12
 */

const router = Router();

router.use(authenticate);

const teacherRoles = [
  UserRole.SCHOOL_ADMIN,
  UserRole.CLASS_TEACHER,
  UserRole.SUBJECT_TEACHER,
  UserRole.DEPARTMENT_HEAD
];

const viewRoles = [
  UserRole.SCHOOL_ADMIN,
  UserRole.CLASS_TEACHER,
  UserRole.SUBJECT_TEACHER,
  UserRole.DEPARTMENT_HEAD,
  UserRole.STUDENT,
  UserRole.PARENT
];

/**
 * @route   GET /api/v1/examinations
 * @desc    List exams with filters and pagination
 * @access  Private (Teacher, Admin)
 */
router.get(
  '/',
  authorize(...teacherRoles),
  getExamsValidation,
  examController.getExams
);

/**
 * @route   POST /api/v1/examinations
 * @desc    Create a new exam
 * @access  Private (Teacher, Admin)
 */
router.post(
  '/',
  authorize(UserRole.SCHOOL_ADMIN, UserRole.CLASS_TEACHER, UserRole.SUBJECT_TEACHER),
  createExamValidation,
  examController.createExam
);

/**
 * @route   GET /api/v1/examinations/report-card/:studentId
 * @desc    Generate report card for a student
 * @access  Private (Teacher, Admin, Student, Parent)
 */
router.get(
  '/report-card/:studentId',
  authorize(...viewRoles),
  generateReportCardValidation,
  examController.generateReportCard
);

/**
 * @route   GET /api/v1/examinations/marksheet/:studentId
 * @desc    Generate mark sheet for a student
 * @access  Private (Teacher, Admin, Student, Parent)
 */
router.get(
  '/marksheet/:studentId',
  authorize(...viewRoles),
  generateMarkSheetValidation,
  examController.generateMarkSheet
);

/**
 * @route   GET /api/v1/examinations/aggregate/:studentId
 * @desc    Calculate aggregate GPA for Class 11-12 students
 * @access  Private (Teacher, Admin, Student, Parent)
 */
router.get(
  '/aggregate/:studentId',
  authorize(...viewRoles),
  calculateAggregateGPAValidation,
  examController.calculateAggregateGPA
);

/**
 * @route   GET /api/v1/examinations/:examId
 * @desc    Get exam details by ID
 * @access  Private (Teacher, Admin)
 */
router.get(
  '/:examId',
  authorize(...teacherRoles),
  getExamByIdValidation,
  examController.getExamById
);

/**
 * @route   PUT /api/v1/examinations/:examId
 * @desc    Update exam
 * @access  Private (Teacher, Admin)
 */
router.put(
  '/:examId',
  authorize(UserRole.SCHOOL_ADMIN, UserRole.CLASS_TEACHER, UserRole.SUBJECT_TEACHER),
  updateExamValidation,
  examController.updateExam
);

/**
 * @route   DELETE /api/v1/examinations/:examId
 * @desc    Delete exam (soft delete)
 * @access  Private (Admin)
 */
router.delete(
  '/:examId',
  authorize(UserRole.SCHOOL_ADMIN),
  deleteExamValidation,
  examController.deleteExam
);

/**
 * @route   POST /api/v1/examinations/:examId/schedule
 * @desc    Create exam schedule
 * @access  Private (Teacher, Admin)
 */
router.post(
  '/:examId/schedule',
  authorize(UserRole.SCHOOL_ADMIN, UserRole.CLASS_TEACHER),
  createExamScheduleValidation,
  examController.createExamSchedule
);

/**
 * @route   GET /api/v1/examinations/:examId/schedule
 * @desc    Get exam schedule
 * @access  Private (Teacher, Admin, Student, Parent)
 */
router.get(
  '/:examId/schedule',
  authorize(...viewRoles),
  getScheduleByIdValidation,
  examController.getExamSchedule
);

/**
 * @route   POST /api/v1/examinations/:examId/grades
 * @desc    Enter grades for an exam
 * @access  Private (Teacher, Admin)
 */
router.post(
  '/:examId/grades',
  authorize(UserRole.SCHOOL_ADMIN, UserRole.CLASS_TEACHER, UserRole.SUBJECT_TEACHER),
  createGradeEntryValidation,
  examController.enterGrades
);

/**
 * @route   POST /api/v1/examinations/:examId/grades/bulk
 * @desc    Bulk grade import
 * @access  Private (Teacher, Admin)
 */
router.post(
  '/:examId/grades/bulk',
  authorize(UserRole.SCHOOL_ADMIN, UserRole.CLASS_TEACHER, UserRole.SUBJECT_TEACHER),
  bulkGradeEntryValidation,
  examController.bulkGradeImport
);

/**
 * @route   GET /api/v1/examinations/:examId/grades/:studentId
 * @desc    Get student grades for an exam
 * @access  Private (Teacher, Admin, Student, Parent)
 */
router.get(
  '/:examId/grades/:studentId',
  authorize(...viewRoles),
  getStudentGradesValidation,
  examController.getStudentGrades
);

/**
 * @route   GET /api/v1/examinations/:examId/analytics
 * @desc    Get exam performance analytics
 * @access  Private (Teacher, Admin)
 */
router.get(
  '/:examId/analytics',
  authorize(...teacherRoles),
  getExamAnalyticsValidation,
  examController.getExamAnalytics
);

/**
 * @route   POST /api/v1/examinations/reports/email
 * @desc    Email report cards
 * @access  Private (Admin, Class_Teacher)
 */
router.post(
  '/reports/email',
  authorize(UserRole.SCHOOL_ADMIN, UserRole.CLASS_TEACHER),
  examController.emailReportCards
);

export default router;
