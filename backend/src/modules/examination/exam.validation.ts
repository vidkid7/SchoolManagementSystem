import { body, param, query } from 'express-validator';
import { ExamType, ExamStatus } from '@models/Exam.model';

/**
 * Exam Validation Rules
 * 
 * Requirements: 7.1-7.12
 */

/**
 * Validation for creating an exam
 */
export const createExamValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Exam name is required')
    .isLength({ max: 255 })
    .withMessage('Exam name must not exceed 255 characters'),

  body('type')
    .notEmpty()
    .withMessage('Exam type is required')
    .isIn(Object.values(ExamType))
    .withMessage('Invalid exam type'),

  body('subjectId')
    .notEmpty()
    .withMessage('Subject ID is required')
    .isInt({ min: 1 })
    .withMessage('Subject ID must be a positive integer'),

  body('classId')
    .notEmpty()
    .withMessage('Class ID is required')
    .isInt({ min: 1 })
    .withMessage('Class ID must be a positive integer'),

  body('academicYearId')
    .notEmpty()
    .withMessage('Academic year ID is required')
    .isInt({ min: 1 })
    .withMessage('Academic year ID must be a positive integer'),

  body('termId')
    .notEmpty()
    .withMessage('Term ID is required')
    .isInt({ min: 1 })
    .withMessage('Term ID must be a positive integer'),

  body('examDate')
    .notEmpty()
    .withMessage('Exam date is required')
    .isISO8601()
    .withMessage('Exam date must be a valid date'),

  body('duration')
    .notEmpty()
    .withMessage('Duration is required')
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer (minutes)'),

  body('fullMarks')
    .notEmpty()
    .withMessage('Full marks is required')
    .isFloat({ min: 0 })
    .withMessage('Full marks must be a non-negative number'),

  body('passMarks')
    .notEmpty()
    .withMessage('Pass marks is required')
    .isFloat({ min: 0 })
    .withMessage('Pass marks must be a non-negative number'),

  body('theoryMarks')
    .notEmpty()
    .withMessage('Theory marks is required')
    .isFloat({ min: 0 })
    .withMessage('Theory marks must be a non-negative number'),

  body('practicalMarks')
    .notEmpty()
    .withMessage('Practical marks is required')
    .isFloat({ min: 0 })
    .withMessage('Practical marks must be a non-negative number'),

  body('weightage')
    .notEmpty()
    .withMessage('Weightage is required')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Weightage must be between 0 and 100'),

  body('isInternal')
    .optional()
    .isBoolean()
    .withMessage('isInternal must be a boolean')
];

/**
 * Validation for updating an exam
 */
export const updateExamValidation = [
  param('examId')
    .notEmpty()
    .withMessage('Exam ID is required')
    .isInt({ min: 1 })
    .withMessage('Exam ID must be a positive integer'),

  body('name')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Exam name must not exceed 255 characters'),

  body('type')
    .optional()
    .isIn(Object.values(ExamType))
    .withMessage('Invalid exam type'),

  body('examDate')
    .optional()
    .isISO8601()
    .withMessage('Exam date must be a valid date'),

  body('duration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer (minutes)'),

  body('fullMarks')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Full marks must be a non-negative number'),

  body('passMarks')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Pass marks must be a non-negative number'),

  body('theoryMarks')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Theory marks must be a non-negative number'),

  body('practicalMarks')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Practical marks must be a non-negative number'),

  body('weightage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Weightage must be between 0 and 100'),

  body('status')
    .optional()
    .isIn(Object.values(ExamStatus))
    .withMessage('Invalid exam status'),

  body('isInternal')
    .optional()
    .isBoolean()
    .withMessage('isInternal must be a boolean')
];

/**
 * Validation for getting exam by ID
 */
export const getExamByIdValidation = [
  param('examId')
    .notEmpty()
    .withMessage('Exam ID is required')
    .isInt({ min: 1 })
    .withMessage('Exam ID must be a positive integer')
];

/**
 * Validation for deleting an exam
 */
export const deleteExamValidation = [
  param('examId')
    .notEmpty()
    .withMessage('Exam ID is required')
    .isInt({ min: 1 })
    .withMessage('Exam ID must be a positive integer')
];

/**
 * Validation for getting exams with filters
 */
export const getExamsValidation = [
  query('classId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Class ID must be a positive integer'),

  query('subjectId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Subject ID must be a positive integer'),

  query('academicYearId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Academic year ID must be a positive integer'),

  query('termId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Term ID must be a positive integer'),

  query('type')
    .optional()
    .isIn(Object.values(ExamType))
    .withMessage('Invalid exam type'),

  query('status')
    .optional()
    .isIn(Object.values(ExamStatus))
    .withMessage('Invalid exam status'),

  query('isInternal')
    .optional()
    .isBoolean()
    .withMessage('isInternal must be a boolean'),

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
 * Validation for getting student grades
 */
export const getStudentGradesValidation = [
  param('examId')
    .notEmpty()
    .withMessage('Exam ID is required')
    .isInt({ min: 1 })
    .withMessage('Exam ID must be a positive integer'),

  param('studentId')
    .notEmpty()
    .withMessage('Student ID is required')
    .isInt({ min: 1 })
    .withMessage('Student ID must be a positive integer')
];

/**
 * Validation for generating report card
 */
export const generateReportCardValidation = [
  param('studentId')
    .notEmpty()
    .withMessage('Student ID is required')
    .isInt({ min: 1 })
    .withMessage('Student ID must be a positive integer'),

  query('termId')
    .notEmpty()
    .withMessage('Term ID is required')
    .isInt({ min: 1 })
    .withMessage('Term ID must be a positive integer'),

  query('academicYearId')
    .notEmpty()
    .withMessage('Academic year ID is required')
    .isInt({ min: 1 })
    .withMessage('Academic year ID must be a positive integer'),

  query('language')
    .optional()
    .isIn(['english', 'nepali', 'bilingual'])
    .withMessage('Language must be english, nepali, or bilingual'),

  query('format')
    .optional()
    .isIn(['ledger', 'standard'])
    .withMessage('Format must be ledger or standard')
];

/**
 * Validation for generating mark sheet
 */
export const generateMarkSheetValidation = [
  param('studentId')
    .notEmpty()
    .withMessage('Student ID is required')
    .isInt({ min: 1 })
    .withMessage('Student ID must be a positive integer'),

  query('termId')
    .notEmpty()
    .withMessage('Term ID is required')
    .isInt({ min: 1 })
    .withMessage('Term ID must be a positive integer'),

  query('academicYearId')
    .notEmpty()
    .withMessage('Academic year ID is required')
    .isInt({ min: 1 })
    .withMessage('Academic year ID must be a positive integer'),

  query('language')
    .optional()
    .isIn(['english', 'nepali', 'bilingual'])
    .withMessage('Language must be english, nepali, or bilingual')
];

/**
 * Validation for calculating aggregate GPA
 */
export const calculateAggregateGPAValidation = [
  param('studentId')
    .notEmpty()
    .withMessage('Student ID is required')
    .isInt({ min: 1 })
    .withMessage('Student ID must be a positive integer'),

  query('class11TermId')
    .notEmpty()
    .withMessage('Class 11 term ID is required')
    .isInt({ min: 1 })
    .withMessage('Class 11 term ID must be a positive integer'),

  query('class12TermId')
    .notEmpty()
    .withMessage('Class 12 term ID is required')
    .isInt({ min: 1 })
    .withMessage('Class 12 term ID must be a positive integer'),

  query('academicYearId')
    .notEmpty()
    .withMessage('Academic year ID is required')
    .isInt({ min: 1 })
    .withMessage('Academic year ID must be a positive integer')
];

/**
 * Validation for getting exam analytics
 */
export const getExamAnalyticsValidation = [
  param('examId')
    .notEmpty()
    .withMessage('Exam ID is required')
    .isInt({ min: 1 })
    .withMessage('Exam ID must be a positive integer')
];
