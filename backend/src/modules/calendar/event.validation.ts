import { body, param, query } from 'express-validator';

/**
 * Event Validation Rules
 * 
 * Requirements: 31.1, 31.2, 31.3, 31.4, 31.5, 31.6, 31.7
 */

/**
 * Validation for creating an event
 */
export const createEventValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Event title is required')
    .isLength({ max: 255 })
    .withMessage('Event title must not exceed 255 characters'),

  body('titleNp')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Nepali title must not exceed 255 characters'),

  body('description')
    .optional()
    .trim(),

  body('descriptionNp')
    .optional()
    .trim(),

  body('category')
    .notEmpty()
    .withMessage('Event category is required')
    .isIn(['academic', 'sports', 'cultural', 'holiday', 'exam', 'meeting', 'other'])
    .withMessage('Invalid event category'),

  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid date'),

  body('startDateBS')
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage('BS date must not exceed 10 characters'),

  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),

  body('endDateBS')
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage('BS date must not exceed 10 characters'),

  body('startTime')
    .optional()
    .trim()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:mm format'),

  body('endTime')
    .optional()
    .trim()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:mm format'),

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

  body('isRecurring')
    .optional()
    .isBoolean()
    .withMessage('isRecurring must be a boolean'),

  body('recurrencePattern')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'yearly'])
    .withMessage('Invalid recurrence pattern'),

  body('recurrenceEndDate')
    .optional()
    .isISO8601()
    .withMessage('Recurrence end date must be a valid date'),

  body('targetAudience')
    .optional()
    .isIn(['all', 'students', 'parents', 'teachers', 'staff'])
    .withMessage('Invalid target audience'),

  body('targetClasses')
    .optional()
    .isArray({ min: 1, max: 12 })
    .withMessage('Target classes must be an array of class levels (1-12)'),

  body('targetClasses.*')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Each class level must be between 1 and 12'),

  body('isHoliday')
    .optional()
    .isBoolean()
    .withMessage('isHoliday must be a boolean'),

  body('isNepalGovernmentHoliday')
    .optional()
    .isBoolean()
    .withMessage('isNepalGovernmentHoliday must be a boolean'),

  body('governmentHolidayName')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Government holiday name must not exceed 255 characters'),

  body('governmentHolidayNameNp')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Nepali government holiday name must not exceed 255 characters'),

  body('color')
    .optional()
    .trim()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color code (e.g., #FF5733)')
];

/**
 * Validation for updating an event
 */
export const updateEventValidation = [
  param('eventId')
    .notEmpty()
    .withMessage('Event ID is required')
    .isInt({ min: 1 })
    .withMessage('Event ID must be a positive integer'),

  body('title')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Event title must not exceed 255 characters'),

  body('titleNp')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Nepali title must not exceed 255 characters'),

  body('description')
    .optional()
    .trim(),

  body('descriptionNp')
    .optional()
    .trim(),

  body('category')
    .optional()
    .isIn(['academic', 'sports', 'cultural', 'holiday', 'exam', 'meeting', 'other'])
    .withMessage('Invalid event category'),

  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),

  body('startDateBS')
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage('BS date must not exceed 10 characters'),

  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),

  body('endDateBS')
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage('BS date must not exceed 10 characters'),

  body('startTime')
    .optional()
    .trim()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:mm format'),

  body('endTime')
    .optional()
    .trim()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:mm format'),

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

  body('isRecurring')
    .optional()
    .isBoolean()
    .withMessage('isRecurring must be a boolean'),

  body('recurrencePattern')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'yearly'])
    .withMessage('Invalid recurrence pattern'),

  body('recurrenceEndDate')
    .optional()
    .isISO8601()
    .withMessage('Recurrence end date must be a valid date'),

  body('targetAudience')
    .optional()
    .isIn(['all', 'students', 'parents', 'teachers', 'staff'])
    .withMessage('Invalid target audience'),

  body('targetClasses')
    .optional()
    .isArray({ min: 1, max: 12 })
    .withMessage('Target classes must be an array of class levels (1-12)'),

  body('targetClasses.*')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Each class level must be between 1 and 12'),

  body('isHoliday')
    .optional()
    .isBoolean()
    .withMessage('isHoliday must be a boolean'),

  body('isNepalGovernmentHoliday')
    .optional()
    .isBoolean()
    .withMessage('isNepalGovernmentHoliday must be a boolean'),

  body('governmentHolidayName')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Government holiday name must not exceed 255 characters'),

  body('governmentHolidayNameNp')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Nepali government holiday name must not exceed 255 characters'),

  body('color')
    .optional()
    .trim()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color code (e.g., #FF5733)')
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
 * Validation for deleting an event
 */
export const deleteEventValidation = [
  param('eventId')
    .notEmpty()
    .withMessage('Event ID is required')
    .isInt({ min: 1 })
    .withMessage('Event ID must be a positive integer')
];

/**
 * Validation for updating event status
 */
export const updateEventStatusValidation = [
  param('eventId')
    .notEmpty()
    .withMessage('Event ID is required')
    .isInt({ min: 1 })
    .withMessage('Event ID must be a positive integer'),

  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['scheduled', 'ongoing', 'completed', 'cancelled'])
    .withMessage('Invalid status')
];

/**
 * Validation for getting events with filters
 */
export const getEventsValidation = [
  query('category')
    .optional()
    .isIn(['academic', 'sports', 'cultural', 'holiday', 'exam', 'meeting', 'other'])
    .withMessage('Invalid category'),

  query('status')
    .optional()
    .isIn(['scheduled', 'ongoing', 'completed', 'cancelled'])
    .withMessage('Invalid status'),

  query('targetAudience')
    .optional()
    .isIn(['all', 'students', 'parents', 'teachers', 'staff'])
    .withMessage('Invalid target audience'),

  query('isHoliday')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isHoliday must be true or false'),

  query('isNepalGovernmentHoliday')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isNepalGovernmentHoliday must be true or false'),

  query('isRecurring')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isRecurring must be true or false'),

  query('startDateFrom')
    .optional()
    .isISO8601()
    .withMessage('Start date from must be a valid date'),

  query('startDateTo')
    .optional()
    .isISO8601()
    .withMessage('Start date to must be a valid date'),

  query('venue')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Venue must not exceed 255 characters'),

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
 * Validation for getting events by date range
 */
export const getEventsByDateRangeValidation = [
  query('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid date'),

  query('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('End date must be a valid date'),

  query('category')
    .optional()
    .isIn(['academic', 'sports', 'cultural', 'holiday', 'exam', 'meeting', 'other'])
    .withMessage('Invalid category'),

  query('targetAudience')
    .optional()
    .isIn(['all', 'students', 'parents', 'teachers', 'staff'])
    .withMessage('Invalid target audience'),

  query('isHoliday')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isHoliday must be true or false'),

  query('isNepalGovernmentHoliday')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isNepalGovernmentHoliday must be true or false')
];

/**
 * Validation for getting upcoming events
 */
export const getUpcomingEventsValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),

  query('includeHolidays')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('includeHolidays must be true or false')
];

/**
 * Validation for getting Nepal government holidays
 */
export const getNepalGovernmentHolidaysValidation = [
  query('year')
    .optional()
    .isInt({ min: 2070, max: 2100 })
    .withMessage('Year must be between 2070 and 2100 (BS year)')
];

/**
 * Validation for getting recurring events
 */
export const getRecurringEventsValidation = [
  query('pattern')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'yearly'])
    .withMessage('Invalid recurrence pattern')
];

/**
 * Validation for exporting personal calendar
 */
export const exportPersonalCalendarValidation = [
  query('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid date'),

  query('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('End date must be a valid date'),

  query('targetAudience')
    .notEmpty()
    .withMessage('Target audience is required')
    .isIn(['student', 'parent', 'teacher', 'staff'])
    .withMessage('Invalid target audience')
];

/**
 * Validation for exporting event to iCal
 */
export const exportEventToICalValidation = [
  param('eventId')
    .notEmpty()
    .withMessage('Event ID is required')
    .isInt({ min: 1 })
    .withMessage('Event ID must be a positive integer')
];

/**
 * Validation for getting event statistics
 */
export const getEventStatsValidation = [
  query('startDateFrom')
    .optional()
    .isISO8601()
    .withMessage('Start date from must be a valid date'),

  query('startDateTo')
    .optional()
    .isISO8601()
    .withMessage('Start date to must be a valid date'),

  query('category')
    .optional()
    .isIn(['academic', 'sports', 'cultural', 'holiday', 'exam', 'meeting', 'other'])
    .withMessage('Invalid category')
];