import { body, query, param } from 'express-validator';

/**
 * Academic Module Validation Rules
 * Provides input validation for all academic API endpoints
 * Requirements: 5.1-5.11, 36.5
 */

// ============ Academic Year Validation ============

export const createAcademicYearValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Academic year name is required')
    .isLength({ max: 100 })
    .withMessage('Name must not exceed 100 characters'),
  body('startDateBS')
    .trim()
    .notEmpty()
    .withMessage('Start date (BS) is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Start date (BS) must be in YYYY-MM-DD format'),
  body('endDateBS')
    .trim()
    .notEmpty()
    .withMessage('End date (BS) is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('End date (BS) must be in YYYY-MM-DD format'),
  body('startDateAD')
    .notEmpty()
    .withMessage('Start date (AD) is required')
    .isISO8601()
    .withMessage('Start date (AD) must be a valid date'),
  body('endDateAD')
    .notEmpty()
    .withMessage('End date (AD) is required')
    .isISO8601()
    .withMessage('End date (AD) must be a valid date'),
  body('isCurrent')
    .optional()
    .isBoolean()
    .withMessage('isCurrent must be a boolean')
];

export const updateAcademicYearValidation = [
  body('academicYearId')
    .notEmpty()
    .withMessage('Academic year ID is required')
    .isInt({ min: 1 })
    .withMessage('Academic year ID must be a positive integer'),
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Name must not exceed 100 characters'),
  body('startDateBS')
    .optional()
    .trim()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Start date (BS) must be in YYYY-MM-DD format'),
  body('endDateBS')
    .optional()
    .trim()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('End date (BS) must be in YYYY-MM-DD format'),
  body('startDateAD')
    .optional()
    .isISO8601()
    .withMessage('Start date (AD) must be a valid date'),
  body('endDateAD')
    .optional()
    .isISO8601()
    .withMessage('End date (AD) must be a valid date'),
  body('isCurrent')
    .optional()
    .isBoolean()
    .withMessage('isCurrent must be a boolean')
];

// ============ Term Validation ============

export const getTermsValidation = [
  query('academicYearId')
    .notEmpty()
    .withMessage('Academic year ID is required')
    .isInt({ min: 1 })
    .withMessage('Academic year ID must be a positive integer')
];

export const createTermValidation = [
  body('academicYearId')
    .notEmpty()
    .withMessage('Academic year ID is required')
    .isInt({ min: 1 })
    .withMessage('Academic year ID must be a positive integer'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Term name is required')
    .isLength({ max: 100 })
    .withMessage('Name must not exceed 100 characters'),
  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('examStartDate')
    .optional()
    .isISO8601()
    .withMessage('Exam start date must be a valid date'),
  body('examEndDate')
    .optional()
    .isISO8601()
    .withMessage('Exam end date must be a valid date')
];

export const updateTermValidation = [
  body('termId')
    .notEmpty()
    .withMessage('Term ID is required')
    .isInt({ min: 1 })
    .withMessage('Term ID must be a positive integer'),
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Name must not exceed 100 characters'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('examStartDate')
    .optional()
    .isISO8601()
    .withMessage('Exam start date must be a valid date'),
  body('examEndDate')
    .optional()
    .isISO8601()
    .withMessage('Exam end date must be a valid date')
];

// ============ Class Validation ============

export const getClassesValidation = [
  query('academicYearId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Academic year ID must be a positive integer'),
  query('gradeLevel')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Grade level must be between 1 and 12')
];

export const createClassValidation = [
  body('academicYearId')
    .notEmpty()
    .withMessage('Academic year ID is required')
    .isInt({ min: 1 })
    .withMessage('Academic year ID must be a positive integer'),
  body('gradeLevel')
    .notEmpty()
    .withMessage('Grade level is required')
    .isInt({ min: 1, max: 12 })
    .withMessage('Grade level must be between 1 and 12'),
  body('section')
    .trim()
    .notEmpty()
    .withMessage('Section is required')
    .isLength({ max: 10 })
    .withMessage('Section must not exceed 10 characters'),
  body('shift')
    .optional()
    .isIn(['morning', 'day', 'evening'])
    .withMessage('Shift must be morning, day, or evening'),
  body('capacity')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Capacity must be between 1 and 100'),
  body('classTeacherId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Class teacher ID must be a positive integer')
];

export const updateClassValidation = [
  body('classId')
    .notEmpty()
    .withMessage('Class ID is required')
    .isInt({ min: 1 })
    .withMessage('Class ID must be a positive integer'),
  body('academicYearId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Academic year ID must be a positive integer'),
  body('gradeLevel')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Grade level must be between 1 and 12'),
  body('section')
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage('Section must not exceed 10 characters'),
  body('shift')
    .optional()
    .isIn(['morning', 'day', 'evening'])
    .withMessage('Shift must be morning, day, or evening'),
  body('capacity')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Capacity must be between 1 and 100'),
  body('classTeacherId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Class teacher ID must be a positive integer')
];

// ============ Subject Validation ============

export const getSubjectsValidation = [
  query('type')
    .optional()
    .isIn(['compulsory', 'optional'])
    .withMessage('Type must be compulsory or optional'),
  query('stream')
    .optional()
    .isIn(['science', 'management', 'humanities', 'technical'])
    .withMessage('Stream must be science, management, humanities, or technical')
];

export const createSubjectValidation = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Subject code is required')
    .isLength({ max: 20 })
    .withMessage('Code must not exceed 20 characters'),
  body('nameEn')
    .trim()
    .notEmpty()
    .withMessage('English name is required')
    .isLength({ max: 100 })
    .withMessage('English name must not exceed 100 characters'),
  body('nameNp')
    .trim()
    .notEmpty()
    .withMessage('Nepali name is required')
    .isLength({ max: 100 })
    .withMessage('Nepali name must not exceed 100 characters'),
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['compulsory', 'optional'])
    .withMessage('Type must be compulsory or optional'),
  body('stream')
    .optional()
    .isIn(['science', 'management', 'humanities', 'technical'])
    .withMessage('Stream must be science, management, humanities, or technical'),
  body('creditHours')
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage('Credit hours must be between 1 and 500'),
  body('theoryMarks')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Theory marks must be between 0 and 100'),
  body('practicalMarks')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Practical marks must be between 0 and 100'),
  body('passMarks')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Pass marks must be between 0 and 100')
];

export const updateSubjectValidation = [
  body('subjectId')
    .notEmpty()
    .withMessage('Subject ID is required')
    .isInt({ min: 1 })
    .withMessage('Subject ID must be a positive integer'),
  body('code')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Code must not exceed 20 characters'),
  body('nameEn')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('English name must not exceed 100 characters'),
  body('nameNp')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Nepali name must not exceed 100 characters'),
  body('type')
    .optional()
    .isIn(['compulsory', 'optional'])
    .withMessage('Type must be compulsory or optional'),
  body('stream')
    .optional()
    .isIn(['science', 'management', 'humanities', 'technical'])
    .withMessage('Stream must be science, management, humanities, or technical'),
  body('creditHours')
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage('Credit hours must be between 1 and 500'),
  body('theoryMarks')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Theory marks must be between 0 and 100'),
  body('practicalMarks')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Practical marks must be between 0 and 100'),
  body('passMarks')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Pass marks must be between 0 and 100')
];

// ============ Timetable Validation ============

export const getTimetableValidation = [
  query('classId')
    .notEmpty()
    .withMessage('Class ID is required')
    .isInt({ min: 1 })
    .withMessage('Class ID must be a positive integer'),
  query('academicYearId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Academic year ID must be a positive integer')
];

export const getTimetableByClassValidation = [
  param('classId')
    .notEmpty()
    .withMessage('Class ID is required')
    .isInt({ min: 1 })
    .withMessage('Class ID must be a positive integer'),
  query('academicYearId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Academic year ID must be a positive integer')
];

export const createTimetableValidation = [
  // For creating timetable (when timetableId is NOT provided)
  body('classId')
    .if((value, { req }) => !req.body.timetableId)
    .notEmpty()
    .withMessage('Class ID is required when creating timetable')
    .isInt({ min: 1 })
    .withMessage('Class ID must be a positive integer'),
  body('academicYearId')
    .if((value, { req }) => !req.body.timetableId)
    .notEmpty()
    .withMessage('Academic year ID is required when creating timetable')
    .isInt({ min: 1 })
    .withMessage('Academic year ID must be a positive integer'),
  body('dayOfWeek')
    .if((value, { req }) => !req.body.timetableId)
    .notEmpty()
    .withMessage('Day of week is required when creating timetable')
    .isInt({ min: 0, max: 6 })
    .withMessage('Day of week must be between 0 (Sunday) and 6 (Saturday)'),
  
  // For adding period (when timetableId IS provided)
  body('timetableId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Timetable ID must be a positive integer'),
  body('periodNumber')
    .if((value, { req }) => req.body.timetableId)
    .notEmpty()
    .withMessage('Period number is required when adding period')
    .isInt({ min: 1, max: 10 })
    .withMessage('Period number must be between 1 and 10'),
  body('startTime')
    .if((value, { req }) => req.body.timetableId)
    .notEmpty()
    .withMessage('Start time is required when adding period')
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:mm format (e.g., 09:00)'),
  body('endTime')
    .if((value, { req }) => req.body.timetableId)
    .notEmpty()
    .withMessage('End time is required when adding period')
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:mm format (e.g., 09:45)'),
  body('subjectId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Subject ID must be a positive integer'),
  body('teacherId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Teacher ID must be a positive integer'),
  body('roomNumber')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Room number must not exceed 50 characters')
];

export const updateTimetableValidation = [
  body('periodId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Period ID must be a positive integer'),
  body('timetableId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Timetable ID must be a positive integer'),
  body('periodNumber')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Period number must be between 1 and 10'),
  body('startTime')
    .optional()
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:mm format (e.g., 09:00)'),
  body('endTime')
    .optional()
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:mm format (e.g., 09:45)'),
  body('subjectId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Subject ID must be a positive integer'),
  body('teacherId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Teacher ID must be a positive integer'),
  body('roomNumber')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Room number must not exceed 50 characters'),
  body('classId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Class ID must be a positive integer'),
  body('academicYearId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Academic year ID must be a positive integer'),
  body('dayOfWeek')
    .optional()
    .isInt({ min: 0, max: 6 })
    .withMessage('Day of week must be between 0 (Sunday) and 6 (Saturday)')
];

// ============ Syllabus Validation ============

export const getSyllabusValidation = [
  query('subjectId')
    .notEmpty()
    .withMessage('Subject ID is required')
    .isInt({ min: 1 })
    .withMessage('Subject ID must be a positive integer'),
  query('classId')
    .notEmpty()
    .withMessage('Class ID is required')
    .isInt({ min: 1 })
    .withMessage('Class ID must be a positive integer'),
  query('academicYearId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Academic year ID must be a positive integer')
];

export const getSyllabusBySubjectValidation = [
  param('subjectId')
    .notEmpty()
    .withMessage('Subject ID is required')
    .isInt({ min: 1 })
    .withMessage('Subject ID must be a positive integer'),
  query('classId')
    .notEmpty()
    .withMessage('Class ID is required')
    .isInt({ min: 1 })
    .withMessage('Class ID must be a positive integer'),
  query('academicYearId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Academic year ID must be a positive integer')
];

export const createSyllabusValidation = [
  body('syllabusId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Syllabus ID must be a positive integer'),
  body('subjectId')
    .if(body('syllabusId').not().exists())
    .notEmpty()
    .withMessage('Subject ID is required when creating syllabus')
    .isInt({ min: 1 })
    .withMessage('Subject ID must be a positive integer'),
  body('classId')
    .if(body('syllabusId').not().exists())
    .notEmpty()
    .withMessage('Class ID is required when creating syllabus')
    .isInt({ min: 1 })
    .withMessage('Class ID must be a positive integer'),
  body('academicYearId')
    .if(body('syllabusId').not().exists())
    .notEmpty()
    .withMessage('Academic year ID is required when creating syllabus')
    .isInt({ min: 1 })
    .withMessage('Academic year ID must be a positive integer'),
  body('title')
    .if(body('syllabusId').exists())
    .notEmpty()
    .withMessage('Title is required when adding topic')
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title must not exceed 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('estimatedHours')
    .if(body('syllabusId').exists())
    .notEmpty()
    .withMessage('Estimated hours is required when adding topic')
    .isInt({ min: 1, max: 500 })
    .withMessage('Estimated hours must be between 1 and 500')
];

export const updateSyllabusValidation = [
  body('topicId')
    .notEmpty()
    .withMessage('Topic ID is required')
    .isInt({ min: 1 })
    .withMessage('Topic ID must be a positive integer'),
  body('completedHours')
    .notEmpty()
    .withMessage('Completed hours is required')
    .isInt({ min: 0, max: 500 })
    .withMessage('Completed hours must be between 0 and 500')
];
