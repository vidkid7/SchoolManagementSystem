import { body, param, query } from 'express-validator';

/**
 * ECA Validation Rules
 * 
 * Requirements: 11.1-11.10
 */

/**
 * Validation for creating an ECA
 */
export const createECAValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('ECA name is required')
    .isLength({ max: 200 })
    .withMessage('ECA name must not exceed 200 characters'),

  body('nameNp')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Nepali name must not exceed 200 characters'),

  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['club', 'cultural', 'community_service', 'leadership'])
    .withMessage('Invalid category'),

  body('subcategory')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Subcategory must not exceed 100 characters'),

  body('description')
    .optional()
    .trim(),

  body('descriptionNp')
    .optional()
    .trim(),

  body('coordinatorId')
    .notEmpty()
    .withMessage('Coordinator ID is required')
    .isInt({ min: 1 })
    .withMessage('Coordinator ID must be a positive integer'),

  body('schedule')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Schedule must not exceed 255 characters'),

  body('capacity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Capacity must be a positive integer'),

  body('academicYearId')
    .notEmpty()
    .withMessage('Academic year ID is required')
    .isInt({ min: 1 })
    .withMessage('Academic year ID must be a positive integer')
];

/**
 * Validation for updating an ECA
 */
export const updateECAValidation = [
  param('ecaId')
    .notEmpty()
    .withMessage('ECA ID is required')
    .isInt({ min: 1 })
    .withMessage('ECA ID must be a positive integer'),

  body('name')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('ECA name must not exceed 200 characters'),

  body('nameNp')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Nepali name must not exceed 200 characters'),

  body('category')
    .optional()
    .isIn(['club', 'cultural', 'community_service', 'leadership'])
    .withMessage('Invalid category'),

  body('subcategory')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Subcategory must not exceed 100 characters'),

  body('description')
    .optional()
    .trim(),

  body('descriptionNp')
    .optional()
    .trim(),

  body('coordinatorId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Coordinator ID must be a positive integer'),

  body('schedule')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Schedule must not exceed 255 characters'),

  body('capacity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Capacity must be a positive integer'),

  body('status')
    .optional()
    .isIn(['active', 'inactive', 'completed'])
    .withMessage('Invalid status')
];

/**
 * Validation for getting ECA by ID
 */
export const getECAByIdValidation = [
  param('ecaId')
    .notEmpty()
    .withMessage('ECA ID is required')
    .isInt({ min: 1 })
    .withMessage('ECA ID must be a positive integer')
];

/**
 * Validation for deleting an ECA
 */
export const deleteECAValidation = [
  param('ecaId')
    .notEmpty()
    .withMessage('ECA ID is required')
    .isInt({ min: 1 })
    .withMessage('ECA ID must be a positive integer')
];

/**
 * Validation for getting ECAs with filters
 */
export const getECAsValidation = [
  query('category')
    .optional()
    .isIn(['club', 'cultural', 'community_service', 'leadership'])
    .withMessage('Invalid category'),

  query('status')
    .optional()
    .isIn(['active', 'inactive', 'completed'])
    .withMessage('Invalid status'),

  query('coordinatorId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Coordinator ID must be a positive integer'),

  query('academicYearId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Academic year ID must be a positive integer'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

/**
 * Validation for enrolling a student
 */
export const enrollStudentValidation = [
  param('ecaId')
    .notEmpty()
    .withMessage('ECA ID is required')
    .isInt({ min: 1 })
    .withMessage('ECA ID must be a positive integer'),

  body('studentId')
    .notEmpty()
    .withMessage('Student ID is required')
    .isInt({ min: 1 })
    .withMessage('Student ID must be a positive integer'),

  body('enrollmentDate')
    .optional()
    .isISO8601()
    .withMessage('Enrollment date must be a valid date'),

  body('remarks')
    .optional()
    .trim()
];

/**
 * Validation for marking attendance
 */
export const markAttendanceValidation = [
  param('ecaId')
    .notEmpty()
    .withMessage('ECA ID is required')
    .isInt({ min: 1 })
    .withMessage('ECA ID must be a positive integer'),

  body('attendanceData')
    .isArray({ min: 1 })
    .withMessage('Attendance data must be a non-empty array'),

  body('attendanceData.*.enrollmentId')
    .notEmpty()
    .withMessage('Enrollment ID is required')
    .isInt({ min: 1 })
    .withMessage('Enrollment ID must be a positive integer'),

  body('attendanceData.*.present')
    .notEmpty()
    .withMessage('Present status is required')
    .isBoolean()
    .withMessage('Present must be a boolean')
];

/**
 * Validation for creating an event
 */
export const createEventValidation = [
  body('ecaId')
    .notEmpty()
    .withMessage('ECA ID is required')
    .isInt({ min: 1 })
    .withMessage('ECA ID must be a positive integer'),

  body('name')
    .trim()
    .notEmpty()
    .withMessage('Event name is required')
    .isLength({ max: 255 })
    .withMessage('Event name must not exceed 255 characters'),

  body('nameNp')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Nepali name must not exceed 255 characters'),

  body('type')
    .notEmpty()
    .withMessage('Event type is required')
    .isIn(['competition', 'performance', 'exhibition', 'workshop', 'other'])
    .withMessage('Invalid event type'),

  body('description')
    .optional()
    .trim(),

  body('descriptionNp')
    .optional()
    .trim(),

  body('eventDate')
    .notEmpty()
    .withMessage('Event date is required')
    .isISO8601()
    .withMessage('Event date must be a valid date'),

  body('eventDateBS')
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage('BS date must not exceed 10 characters'),

  body('venue')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Venue must not exceed 255 characters'),

  body('venueNp')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Nepali venue must not exceed 255 characters'),

  body('organizer')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Organizer must not exceed 255 characters'),

  body('remarks')
    .optional()
    .trim()
];

/**
 * Validation for getting event by ID
 */
export const getEventByIdValidation = [
  param('eventId')
    .notEmpty()
    .withMessage('Event ID is required')
    .isInt({ min: 1 })
    .withMessage('Event ID must be a positive integer')
];

/**
 * Validation for recording achievement
 */
export const recordAchievementValidation = [
  param('ecaId')
    .notEmpty()
    .withMessage('ECA ID is required')
    .isInt({ min: 1 })
    .withMessage('ECA ID must be a positive integer'),

  body('studentId')
    .notEmpty()
    .withMessage('Student ID is required')
    .isInt({ min: 1 })
    .withMessage('Student ID must be a positive integer'),

  body('eventId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Event ID must be a positive integer'),

  body('title')
    .trim()
    .notEmpty()
    .withMessage('Achievement title is required')
    .isLength({ max: 255 })
    .withMessage('Title must not exceed 255 characters'),

  body('titleNp')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Nepali title must not exceed 255 characters'),

  body('type')
    .notEmpty()
    .withMessage('Achievement type is required')
    .isIn(['award', 'medal', 'certificate', 'recognition', 'position'])
    .withMessage('Invalid achievement type'),

  body('level')
    .notEmpty()
    .withMessage('Achievement level is required')
    .isIn(['school', 'district', 'regional', 'national', 'international'])
    .withMessage('Invalid achievement level'),

  body('position')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Position must not exceed 50 characters'),

  body('description')
    .optional()
    .trim(),

  body('descriptionNp')
    .optional()
    .trim(),

  body('achievementDate')
    .notEmpty()
    .withMessage('Achievement date is required')
    .isISO8601()
    .withMessage('Achievement date must be a valid date'),

  body('achievementDateBS')
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage('BS date must not exceed 10 characters'),

  body('remarks')
    .optional()
    .trim()
];

/**
 * Validation for getting student ECA history
 */
export const getStudentECAHistoryValidation = [
  param('studentId')
    .notEmpty()
    .withMessage('Student ID is required')
    .isInt({ min: 1 })
    .withMessage('Student ID must be a positive integer')
];
