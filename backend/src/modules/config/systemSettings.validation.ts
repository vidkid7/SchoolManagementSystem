import Joi from 'joi';

// Grading Scheme Validation
export const createGradingSchemeSchema = Joi.object({
  name: Joi.string().max(100).required().messages({
    'string.empty': 'Grading scheme name is required',
    'string.max': 'Name must not exceed 100 characters',
  }),
  description: Joi.string().optional().allow(''),
  isDefault: Joi.boolean().optional(),
  grades: Joi.array()
    .items(
      Joi.object({
        grade: Joi.string().required().messages({
          'string.empty': 'Grade is required',
        }),
        gradePoint: Joi.number().min(0).max(4).required().messages({
          'number.base': 'Grade point must be a number',
          'number.min': 'Grade point must be at least 0',
          'number.max': 'Grade point must not exceed 4',
        }),
        minPercentage: Joi.number().min(0).max(100).required().messages({
          'number.base': 'Minimum percentage must be a number',
          'number.min': 'Minimum percentage must be at least 0',
          'number.max': 'Minimum percentage must not exceed 100',
        }),
        maxPercentage: Joi.number().min(0).max(100).required().messages({
          'number.base': 'Maximum percentage must be a number',
          'number.min': 'Maximum percentage must be at least 0',
          'number.max': 'Maximum percentage must not exceed 100',
        }),
        description: Joi.string().required().messages({
          'string.empty': 'Grade description is required',
        }),
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one grade must be defined',
    }),
});

export const updateGradingSchemeSchema = Joi.object({
  name: Joi.string().max(100).optional(),
  description: Joi.string().optional().allow(''),
  isDefault: Joi.boolean().optional(),
  grades: Joi.array()
    .items(
      Joi.object({
        grade: Joi.string().required(),
        gradePoint: Joi.number().min(0).max(4).required(),
        minPercentage: Joi.number().min(0).max(100).required(),
        maxPercentage: Joi.number().min(0).max(100).required(),
        description: Joi.string().required(),
      })
    )
    .min(1)
    .optional(),
}).min(1);

// Attendance Rule Validation
export const createAttendanceRuleSchema = Joi.object({
  name: Joi.string().max(100).required().messages({
    'string.empty': 'Attendance rule name is required',
    'string.max': 'Name must not exceed 100 characters',
  }),
  description: Joi.string().optional().allow(''),
  minimumAttendancePercentage: Joi.number().min(0).max(100).optional(),
  lowAttendanceThreshold: Joi.number().min(0).max(100).optional(),
  criticalAttendanceThreshold: Joi.number().min(0).max(100).optional(),
  correctionWindowHours: Joi.number().integer().min(0).optional(),
  allowTeacherCorrection: Joi.boolean().optional(),
  allowAdminCorrection: Joi.boolean().optional(),
  maxLeaveDaysPerMonth: Joi.number().integer().min(0).optional(),
  maxLeaveDaysPerYear: Joi.number().integer().min(0).optional(),
  requireLeaveApproval: Joi.boolean().optional(),
  enableLowAttendanceAlerts: Joi.boolean().optional(),
  alertParents: Joi.boolean().optional(),
  alertAdmins: Joi.boolean().optional(),
});

export const updateAttendanceRuleSchema = Joi.object({
  name: Joi.string().max(100).optional(),
  description: Joi.string().optional().allow(''),
  minimumAttendancePercentage: Joi.number().min(0).max(100).optional(),
  lowAttendanceThreshold: Joi.number().min(0).max(100).optional(),
  criticalAttendanceThreshold: Joi.number().min(0).max(100).optional(),
  correctionWindowHours: Joi.number().integer().min(0).optional(),
  allowTeacherCorrection: Joi.boolean().optional(),
  allowAdminCorrection: Joi.boolean().optional(),
  maxLeaveDaysPerMonth: Joi.number().integer().min(0).optional(),
  maxLeaveDaysPerYear: Joi.number().integer().min(0).optional(),
  requireLeaveApproval: Joi.boolean().optional(),
  enableLowAttendanceAlerts: Joi.boolean().optional(),
  alertParents: Joi.boolean().optional(),
  alertAdmins: Joi.boolean().optional(),
}).min(1);

// Notification Template Validation
export const createNotificationTemplateSchema = Joi.object({
  name: Joi.string().max(100).required().messages({
    'string.empty': 'Template name is required',
    'string.max': 'Name must not exceed 100 characters',
  }),
  code: Joi.string().max(50).required().messages({
    'string.empty': 'Template code is required',
    'string.max': 'Code must not exceed 50 characters',
  }),
  description: Joi.string().optional().allow(''),
  category: Joi.string()
    .valid('attendance', 'exam', 'fee', 'grade', 'announcement', 'leave', 'library', 'general')
    .required()
    .messages({
      'any.only': 'Invalid category',
    }),
  channel: Joi.string().valid('sms', 'email', 'push', 'in_app').required().messages({
    'any.only': 'Invalid channel',
  }),
  language: Joi.string().valid('nepali', 'english').required().messages({
    'any.only': 'Invalid language',
  }),
  subject: Joi.string().max(255).optional().allow(''),
  templateEn: Joi.string().required().messages({
    'string.empty': 'English template is required',
  }),
  templateNp: Joi.string().optional().allow(''),
  variables: Joi.array().items(Joi.string()).optional(),
});

export const updateNotificationTemplateSchema = Joi.object({
  name: Joi.string().max(100).optional(),
  code: Joi.string().max(50).optional(),
  description: Joi.string().optional().allow(''),
  category: Joi.string()
    .valid('attendance', 'exam', 'fee', 'grade', 'announcement', 'leave', 'library', 'general')
    .optional(),
  channel: Joi.string().valid('sms', 'email', 'push', 'in_app').optional(),
  language: Joi.string().valid('nepali', 'english').optional(),
  subject: Joi.string().max(255).optional().allow(''),
  templateEn: Joi.string().optional(),
  templateNp: Joi.string().optional().allow(''),
  variables: Joi.array().items(Joi.string()).optional(),
}).min(1);

// Date Format Settings Validation
export const updateDateFormatSettingsSchema = Joi.object({
  dateFormat: Joi.string().max(50).optional(),
  timeFormat: Joi.string().max(50).optional(),
  numberFormat: Joi.string().max(50).optional(),
  currency: Joi.string().max(10).optional(),
}).min(1);
