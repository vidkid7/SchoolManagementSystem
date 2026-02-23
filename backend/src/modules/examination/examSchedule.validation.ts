import { body, param, query } from 'express-validator';

/**
 * Validation rules for exam schedule endpoints
 */

/**
 * Validation for creating exam schedule
 */
export const createExamScheduleValidation = [
  body('examId')
    .isInt({ min: 1 })
    .withMessage('Exam ID must be a positive integer'),
  
  body('subjectId')
    .isInt({ min: 1 })
    .withMessage('Subject ID must be a positive integer'),
  
  body('date')
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date'),
  
  body('startTime')
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:mm format (00:00 to 23:59)'),
  
  body('endTime')
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:mm format (00:00 to 23:59)'),
  
  body('roomNumber')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Room number must be between 1 and 50 characters'),
  
  body('invigilators')
    .optional()
    .isArray()
    .withMessage('Invigilators must be an array'),
  
  body('invigilators.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Each invigilator ID must be a positive integer')
];

/**
 * Validation for updating exam schedule
 */
export const updateExamScheduleValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Schedule ID must be a positive integer'),
  
  body('examId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Exam ID must be a positive integer'),
  
  body('subjectId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Subject ID must be a positive integer'),
  
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date'),
  
  body('startTime')
    .optional()
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:mm format (00:00 to 23:59)'),
  
  body('endTime')
    .optional()
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:mm format (00:00 to 23:59)'),
  
  body('roomNumber')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Room number must be between 1 and 50 characters'),
  
  body('invigilators')
    .optional()
    .isArray()
    .withMessage('Invigilators must be an array'),
  
  body('invigilators.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Each invigilator ID must be a positive integer')
];

/**
 * Validation for getting schedule by ID
 */
export const getScheduleByIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Schedule ID must be a positive integer')
];

/**
 * Validation for getting schedules by exam ID
 */
export const getSchedulesByExamIdValidation = [
  param('examId')
    .isInt({ min: 1 })
    .withMessage('Exam ID must be a positive integer')
];

/**
 * Validation for getting schedules by date
 */
export const getSchedulesByDateValidation = [
  query('date')
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date')
];

/**
 * Validation for getting schedules by date range
 */
export const getSchedulesByDateRangeValidation = [
  query('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  
  query('endDate')
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
];

/**
 * Validation for getting schedules by invigilator
 */
export const getSchedulesByInvigilatorValidation = [
  param('teacherId')
    .isInt({ min: 1 })
    .withMessage('Teacher ID must be a positive integer'),
  
  query('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date')
];

/**
 * Validation for getting schedules by room
 */
export const getSchedulesByRoomValidation = [
  param('roomNumber')
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Room number must be between 1 and 50 characters'),
  
  query('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date')
];

/**
 * Validation for generating class timetable
 */
export const generateClassTimetableValidation = [
  param('classId')
    .isInt({ min: 1 })
    .withMessage('Class ID must be a positive integer'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
];

/**
 * Validation for generating teacher timetable
 */
export const generateTeacherTimetableValidation = [
  param('teacherId')
    .isInt({ min: 1 })
    .withMessage('Teacher ID must be a positive integer'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
];

/**
 * Validation for deleting schedule
 */
export const deleteScheduleValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Schedule ID must be a positive integer')
];

/**
 * Validation for bulk create schedules
 */
export const bulkCreateSchedulesValidation = [
  body('schedules')
    .isArray({ min: 1 })
    .withMessage('Schedules must be a non-empty array'),
  
  body('schedules.*.examId')
    .isInt({ min: 1 })
    .withMessage('Exam ID must be a positive integer'),
  
  body('schedules.*.subjectId')
    .isInt({ min: 1 })
    .withMessage('Subject ID must be a positive integer'),
  
  body('schedules.*.date')
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date'),
  
  body('schedules.*.startTime')
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:mm format (00:00 to 23:59)'),
  
  body('schedules.*.endTime')
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:mm format (00:00 to 23:59)'),
  
  body('schedules.*.roomNumber')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Room number must be between 1 and 50 characters'),
  
  body('schedules.*.invigilators')
    .optional()
    .isArray()
    .withMessage('Invigilators must be an array'),
  
  body('schedules.*.invigilators.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Each invigilator ID must be a positive integer')
];
