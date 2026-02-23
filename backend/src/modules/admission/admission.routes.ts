import { Router } from 'express';
import admissionController from './admission.controller';
import { authenticate, authorize } from '@middleware/auth';
import { validate } from '@middleware/validation';
import { UserRole } from '@models/User.model';
import { admissionValidation } from './admission.validation';

const ADMISSION_ROLES = [UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT];

const router = Router();

/**
 * @route   GET /api/v1/admissions
 * @desc    List admissions with filters
 * @access  Private (School_Admin)
 */
router.get(
  '/',
  authenticate,
  authorize(...ADMISSION_ROLES),
  validate(admissionValidation.listAdmissionsQuery, 'query'),
  admissionController.getAll
);

/**
 * @route   GET /api/v1/admissions/reports
 * @desc    Get admission statistics
 * @access  Private (School_Admin)
 */
router.get(
  '/reports',
  authenticate,
  authorize(...ADMISSION_ROLES),
  validate(admissionValidation.getStatisticsQuery, 'query'),
  admissionController.getStatistics
);

/**
 * @route   POST /api/v1/admissions/inquiry
 * @desc    Create new inquiry
 * @access  Private (School_Admin)
 */
router.post(
  '/inquiry',
  authenticate,
  authorize(...ADMISSION_ROLES),
  validate(admissionValidation.createInquiry),
  admissionController.createInquiry
);

/**
 * @route   GET /api/v1/admissions/:id
 * @desc    Get admission by ID
 * @access  Private (School_Admin)
 */
router.get(
  '/:id',
  authenticate,
  authorize(...ADMISSION_ROLES),
  validate(admissionValidation.idParam, 'params'),
  admissionController.getById
);

/**
 * @route   POST /api/v1/admissions/:id/apply
 * @desc    Convert inquiry to application
 * @access  Private (School_Admin)
 */
router.post(
  '/:id/apply',
  authenticate,
  authorize(...ADMISSION_ROLES),
  validate(admissionValidation.idParam, 'params'),
  validate(admissionValidation.convertToApplication),
  admissionController.convertToApplication
);

/**
 * @route   POST /api/v1/admissions/:id/schedule-test
 * @desc    Schedule admission test
 * @access  Private (School_Admin)
 */
router.post(
  '/:id/schedule-test',
  authenticate,
  authorize(...ADMISSION_ROLES),
  validate(admissionValidation.idParam, 'params'),
  validate(admissionValidation.scheduleTest),
  admissionController.scheduleTest
);

/**
 * @route   POST /api/v1/admissions/:id/record-test-score
 * @desc    Record admission test score
 * @access  Private (School_Admin)
 */
router.post(
  '/:id/record-test-score',
  authenticate,
  authorize(...ADMISSION_ROLES),
  validate(admissionValidation.idParam, 'params'),
  validate(admissionValidation.recordTestScore),
  admissionController.recordTestScore
);

/**
 * @route   POST /api/v1/admissions/:id/schedule-interview
 * @desc    Schedule interview
 * @access  Private (School_Admin)
 */
router.post(
  '/:id/schedule-interview',
  authenticate,
  authorize(...ADMISSION_ROLES),
  validate(admissionValidation.idParam, 'params'),
  validate(admissionValidation.scheduleInterview),
  admissionController.scheduleInterview
);

/**
 * @route   POST /api/v1/admissions/:id/record-interview
 * @desc    Record interview feedback
 * @access  Private (School_Admin)
 */
router.post(
  '/:id/record-interview',
  authenticate,
  authorize(...ADMISSION_ROLES),
  validate(admissionValidation.idParam, 'params'),
  validate(admissionValidation.recordInterview),
  admissionController.recordInterview
);

/**
 * @route   POST /api/v1/admissions/:id/admit
 * @desc    Admit applicant
 * @access  Private (School_Admin)
 */
router.post(
  '/:id/admit',
  authenticate,
  authorize(...ADMISSION_ROLES),
  validate(admissionValidation.idParam, 'params'),
  admissionController.admit
);

/**
 * @route   POST /api/v1/admissions/:id/enroll
 * @desc    Enroll admitted applicant as student
 * @access  Private (School_Admin)
 */
router.post(
  '/:id/enroll',
  authenticate,
  authorize(...ADMISSION_ROLES),
  validate(admissionValidation.idParam, 'params'),
  validate(admissionValidation.enroll),
  admissionController.enroll
);

/**
 * @route   POST /api/v1/admissions/:id/reject
 * @desc    Reject applicant
 * @access  Private (School_Admin)
 */
router.post(
  '/:id/reject',
  authenticate,
  authorize(...ADMISSION_ROLES),
  validate(admissionValidation.idParam, 'params'),
  validate(admissionValidation.reject),
  admissionController.reject
);

export default router;
