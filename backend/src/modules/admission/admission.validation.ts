import Joi from 'joi';
import { AdmissionStatus } from '@models/Admission.model';

/**
 * Phone number validation (Nepal format)
 * Supports: +977-9841234567, 9841234567, 01-4123456
 */
const phoneSchema = Joi.string()
  .pattern(/^(\+977[-\s]?)?[0-9]{7,10}$/)
  .optional()
  .messages({
    'string.pattern.base': 'Please provide a valid phone number'
  });

/**
 * Email validation
 */
const emailSchema = Joi.string()
  .email()
  .max(100)
  .optional()
  .messages({
    'string.email': 'Please provide a valid email address',
    'string.max': 'Email must not exceed 100 characters'
  });

/**
 * BS date validation (YYYY-MM-DD format)
 */
const bsDateSchema = Joi.string()
  .pattern(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .messages({
    'string.pattern.base': 'Date must be in YYYY-MM-DD format'
  });

/**
 * Create inquiry validation schema
 * POST /api/v1/admissions/inquiry
 */
export const createInquirySchema = Joi.object({
  firstNameEn: Joi.string()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.empty': 'First name is required',
      'string.max': 'First name must not exceed 50 characters'
    }),
  middleNameEn: Joi.string()
    .max(50)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Middle name must not exceed 50 characters'
    }),
  lastNameEn: Joi.string()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Last name is required',
      'string.max': 'Last name must not exceed 50 characters'
    }),
  applyingForClass: Joi.number()
    .integer()
    .min(1)
    .max(12)
    .required()
    .messages({
      'number.base': 'Applying for class must be a number',
      'number.min': 'Class must be between 1 and 12',
      'number.max': 'Class must be between 1 and 12',
      'any.required': 'Applying for class is required'
    }),
  phone: phoneSchema,
  email: emailSchema,
  guardianName: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Guardian name must not exceed 100 characters'
    }),
  guardianPhone: phoneSchema,
  inquirySource: Joi.string()
    .valid('walk-in', 'phone', 'online', 'referral')
    .optional()
    .messages({
      'any.only': 'Inquiry source must be one of: walk-in, phone, online, referral'
    }),
  inquiryNotes: Joi.string()
    .max(1000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Inquiry notes must not exceed 1000 characters'
    }),
  academicYearId: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'Academic year ID must be a number',
      'number.positive': 'Academic year ID must be positive'
    })
});

/**
 * Convert to application validation schema
 * POST /api/v1/admissions/:id/apply
 */
export const convertToApplicationSchema = Joi.object({
  firstNameNp: Joi.string()
    .max(50)
    .optional()
    .allow('')
    .messages({
      'string.max': 'First name (Nepali) must not exceed 50 characters'
    }),
  lastNameNp: Joi.string()
    .max(50)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Last name (Nepali) must not exceed 50 characters'
    }),
  dateOfBirthBS: bsDateSchema,
  dateOfBirthAD: Joi.date()
    .optional()
    .messages({
      'date.base': 'Date of birth must be a valid date'
    }),
  gender: Joi.string()
    .valid('male', 'female', 'other')
    .optional()
    .messages({
      'any.only': 'Gender must be one of: male, female, other'
    }),
  addressEn: Joi.string()
    .max(255)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Address must not exceed 255 characters'
    }),
  addressNp: Joi.string()
    .max(255)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Address (Nepali) must not exceed 255 characters'
    }),
  fatherName: Joi.string()
    .max(100)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Father name must not exceed 100 characters'
    }),
  fatherPhone: phoneSchema,
  motherName: Joi.string()
    .max(100)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Mother name must not exceed 100 characters'
    }),
  motherPhone: phoneSchema,
  previousSchool: Joi.string()
    .max(255)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Previous school must not exceed 255 characters'
    }),
  previousClass: Joi.number()
    .integer()
    .min(1)
    .max(12)
    .optional()
    .messages({
      'number.base': 'Previous class must be a number',
      'number.min': 'Previous class must be between 1 and 12',
      'number.max': 'Previous class must be between 1 and 12'
    }),
  previousGpa: Joi.number()
    .min(0)
    .max(4)
    .optional()
    .messages({
      'number.base': 'Previous GPA must be a number',
      'number.min': 'Previous GPA must be between 0 and 4',
      'number.max': 'Previous GPA must be between 0 and 4'
    }),
  applicationFee: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.base': 'Application fee must be a number',
      'number.min': 'Application fee must be non-negative'
    }),
  applicationFeePaid: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'Application fee paid must be a boolean'
    })
});

/**
 * Schedule test validation schema
 * POST /api/v1/admissions/:id/schedule-test
 */
export const scheduleTestSchema = Joi.object({
  testDate: Joi.date()
    .required()
    .messages({
      'date.base': 'Test date must be a valid date',
      'any.required': 'Test date is required'
    })
});

/**
 * Record test score validation schema
 * POST /api/v1/admissions/:id/record-test-score
 */
export const recordTestScoreSchema = Joi.object({
  score: Joi.number()
    .min(0)
    .required()
    .messages({
      'number.base': 'Score must be a number',
      'number.min': 'Score must be non-negative',
      'any.required': 'Score is required'
    }),
  maxScore: Joi.number()
    .min(0)
    .required()
    .messages({
      'number.base': 'Max score must be a number',
      'number.min': 'Max score must be non-negative',
      'any.required': 'Max score is required'
    }),
  remarks: Joi.string()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Remarks must not exceed 500 characters'
    })
});

/**
 * Schedule interview validation schema
 * POST /api/v1/admissions/:id/schedule-interview
 */
export const scheduleInterviewSchema = Joi.object({
  interviewDate: Joi.date()
    .required()
    .messages({
      'date.base': 'Interview date must be a valid date',
      'any.required': 'Interview date is required'
    }),
  interviewerName: Joi.string()
    .max(100)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Interviewer name must not exceed 100 characters'
    })
});

/**
 * Record interview validation schema
 * POST /api/v1/admissions/:id/record-interview
 */
export const recordInterviewSchema = Joi.object({
  feedback: Joi.string()
    .min(1)
    .max(1000)
    .required()
    .messages({
      'string.empty': 'Feedback is required',
      'string.max': 'Feedback must not exceed 1000 characters',
      'any.required': 'Feedback is required'
    }),
  score: Joi.number()
    .integer()
    .min(0)
    .max(100)
    .optional()
    .messages({
      'number.base': 'Score must be a number',
      'number.integer': 'Score must be an integer',
      'number.min': 'Score must be between 0 and 100',
      'number.max': 'Score must be between 0 and 100'
    })
});

/**
 * Enroll validation schema
 * POST /api/v1/admissions/:id/enroll
 */
export const enrollSchema = Joi.object({
  currentClassId: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'Current class ID must be a number',
      'number.positive': 'Current class ID must be positive'
    }),
  rollNumber: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'Roll number must be a number',
      'number.positive': 'Roll number must be positive'
    })
});

/**
 * Reject validation schema
 * POST /api/v1/admissions/:id/reject
 */
export const rejectSchema = Joi.object({
  reason: Joi.string()
    .min(1)
    .max(500)
    .required()
    .messages({
      'string.empty': 'Rejection reason is required',
      'string.max': 'Rejection reason must not exceed 500 characters',
      'any.required': 'Rejection reason is required'
    })
});

/**
 * List admissions query validation schema
 * GET /api/v1/admissions
 */
export const listAdmissionsQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.min': 'Page must be at least 1'
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(20)
    .messages({
      'number.base': 'Limit must be a number',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 100'
    }),
  status: Joi.string()
    .valid(...Object.values(AdmissionStatus))
    .optional()
    .messages({
      'any.only': `Status must be one of: ${Object.values(AdmissionStatus).join(', ')}`
    }),
  applyingForClass: Joi.number()
    .integer()
    .min(1)
    .max(12)
    .optional()
    .messages({
      'number.base': 'Applying for class must be a number',
      'number.min': 'Class must be between 1 and 12',
      'number.max': 'Class must be between 1 and 12'
    }),
  academicYearId: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'Academic year ID must be a number',
      'number.positive': 'Academic year ID must be positive'
    }),
  search: Joi.string()
    .max(100)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Search query must not exceed 100 characters'
    })
});

/**
 * Get statistics query validation schema
 * GET /api/v1/admissions/reports
 */
export const getStatisticsQuerySchema = Joi.object({
  academicYearId: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'Academic year ID must be a number',
      'number.positive': 'Academic year ID must be positive'
    })
});

/**
 * ID parameter validation schema
 */
export const idParamSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID must be a number',
      'number.positive': 'ID must be positive',
      'any.required': 'ID is required'
    })
});

export const admissionValidation = {
  createInquiry: createInquirySchema,
  convertToApplication: convertToApplicationSchema,
  scheduleTest: scheduleTestSchema,
  recordTestScore: recordTestScoreSchema,
  scheduleInterview: scheduleInterviewSchema,
  recordInterview: recordInterviewSchema,
  enroll: enrollSchema,
  reject: rejectSchema,
  listAdmissionsQuery: listAdmissionsQuerySchema,
  getStatisticsQuery: getStatisticsQuerySchema,
  idParam: idParamSchema
};
