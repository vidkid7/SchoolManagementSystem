import { body, param, query } from 'express-validator';

/**
 * Grade Entry Validation Schemas
 * 
 * Requirements: 7.6, 7.9
 */

/**
 * Validation for creating a single grade entry
 */
export const createGradeEntryValidation = [
  body('examId')
    .isInt({ min: 1 })
    .withMessage('Exam ID must be a positive integer'),
  
  body('studentId')
    .isInt({ min: 1 })
    .withMessage('Student ID must be a positive integer'),
  
  body('theoryMarks')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Theory marks must be between 0 and 1000'),
  
  body('practicalMarks')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Practical marks must be between 0 and 1000'),
  
  body('totalMarks')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Total marks must be between 0 and 1000'),
  
  body('remarks')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Remarks must not exceed 500 characters')
];

/**
 * Validation for updating a grade entry
 */
export const updateGradeEntryValidation = [
  param('gradeId')
    .isInt({ min: 1 })
    .withMessage('Grade ID must be a positive integer'),
  
  body('theoryMarks')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Theory marks must be between 0 and 1000'),
  
  body('practicalMarks')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Practical marks must be between 0 and 1000'),
  
  body('totalMarks')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Total marks must be between 0 and 1000'),
  
  body('remarks')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Remarks must not exceed 500 characters')
];

/**
 * Validation for bulk grade entry
 */
export const bulkGradeEntryValidation = [
  body('examId')
    .isInt({ min: 1 })
    .withMessage('Exam ID must be a positive integer'),
  
  body('grades')
    .isArray({ min: 1 })
    .withMessage('Grades must be a non-empty array'),
  
  body('grades.*.studentId')
    .isInt({ min: 1 })
    .withMessage('Student ID must be a positive integer'),
  
  body('grades.*.theoryMarks')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Theory marks must be between 0 and 1000'),
  
  body('grades.*.practicalMarks')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Practical marks must be between 0 and 1000'),
  
  body('grades.*.totalMarks')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Total marks must be between 0 and 1000'),
  
  body('grades.*.remarks')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Remarks must not exceed 500 characters')
];

/**
 * Validation for weighted grade calculation
 */
export const weightedGradeValidation = [
  body('studentId')
    .isInt({ min: 1 })
    .withMessage('Student ID must be a positive integer'),
  
  body('assessments')
    .isArray({ min: 1 })
    .withMessage('Assessments must be a non-empty array'),
  
  body('assessments.*.examId')
    .isInt({ min: 1 })
    .withMessage('Exam ID must be a positive integer'),
  
  body('assessments.*.weightage')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Weightage must be between 0 and 100')
];

/**
 * Validation for getting grade by ID
 */
export const getGradeByIdValidation = [
  param('gradeId')
    .isInt({ min: 1 })
    .withMessage('Grade ID must be a positive integer')
];

/**
 * Validation for getting grades by exam
 */
export const getGradesByExamValidation = [
  param('examId')
    .isInt({ min: 1 })
    .withMessage('Exam ID must be a positive integer')
];

/**
 * Validation for getting grades by student
 */
export const getGradesByStudentValidation = [
  param('studentId')
    .isInt({ min: 1 })
    .withMessage('Student ID must be a positive integer')
];

/**
 * Validation for getting grade by student and exam
 */
export const getGradeByStudentAndExamValidation = [
  query('studentId')
    .isInt({ min: 1 })
    .withMessage('Student ID must be a positive integer'),
  
  query('examId')
    .isInt({ min: 1 })
    .withMessage('Exam ID must be a positive integer')
];

/**
 * Validation for deleting a grade
 */
export const deleteGradeValidation = [
  param('gradeId')
    .isInt({ min: 1 })
    .withMessage('Grade ID must be a positive integer')
];

/**
 * Validation for exam statistics
 */
export const getExamStatisticsValidation = [
  param('examId')
    .isInt({ min: 1 })
    .withMessage('Exam ID must be a positive integer')
];

/**
 * Validation for bulk Excel import
 */
export const bulkImportExcelValidation = [
  body('examId')
    .isInt({ min: 1 })
    .withMessage('Exam ID must be a positive integer')
];
