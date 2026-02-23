/**
 * CV Validation Schemas
 * Input validation for CV endpoints
 * 
 * Requirements: 26.3, 26.4
 */

import { body, param } from 'express-validator';

// Student ID parameter validation
export const studentIdParamValidation = [
  param('studentId')
    .isInt({ min: 1 })
    .withMessage('Student ID must be a positive integer')
];

// CV update validation
export const cvUpdateValidation = [
  body('showPersonalInfo')
    .optional()
    .isBoolean()
    .withMessage('showPersonalInfo must be a boolean'),
  
  body('showAcademicPerformance')
    .optional()
    .isBoolean()
    .withMessage('showAcademicPerformance must be a boolean'),
  
  body('showAttendance')
    .optional()
    .isBoolean()
    .withMessage('showAttendance must be a boolean'),
  
  body('showECA')
    .optional()
    .isBoolean()
    .withMessage('showECA must be a boolean'),
  
  body('showSports')
    .optional()
    .isBoolean()
    .withMessage('showSports must be a boolean'),
  
  body('showCertificates')
    .optional()
    .isBoolean()
    .withMessage('showCertificates must be a boolean'),
  
  body('showAwards')
    .optional()
    .isBoolean()
    .withMessage('showAwards must be a boolean'),
  
  body('showTeacherRemarks')
    .optional()
    .isBoolean()
    .withMessage('showTeacherRemarks must be a boolean'),
  
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),
  
  body('skills.*')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Each skill must be a non-empty string'),
  
  body('hobbies')
    .optional()
    .isArray()
    .withMessage('Hobbies must be an array'),
  
  body('hobbies.*')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Each hobby must be a non-empty string'),
  
  body('careerGoals')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Career goals must be less than 1000 characters'),
  
  body('personalStatement')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Personal statement must be less than 2000 characters'),
  
  body('templateId')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Template ID must be less than 50 characters'),
  
  body('schoolBrandingEnabled')
    .optional()
    .isBoolean()
    .withMessage('schoolBrandingEnabled must be a boolean')
];

// CV generation options validation
export const cvGenerationOptionsValidation = [
  body('templateId')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Template ID must be less than 50 characters'),
  
  body('schoolBrandingEnabled')
    .optional()
    .isBoolean()
    .withMessage('schoolBrandingEnabled must be a boolean')
];

export default {
  studentIdParamValidation,
  cvUpdateValidation,
  cvGenerationOptionsValidation
};