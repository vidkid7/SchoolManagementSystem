import Joi from 'joi';
import { UserRole } from '@models/User.model';

export const schoolIdParamSchema = Joi.object({
  schoolId: Joi.string().uuid().required(),
});

export const createSchoolSchema = Joi.object({
  schoolNameEn: Joi.string().max(255).required(),
  schoolNameNp: Joi.string().max(255).optional().allow(''),
  schoolCode: Joi.string().max(50).optional().allow(''),
  addressEn: Joi.string().optional().allow(''),
  addressNp: Joi.string().optional().allow(''),
  phone: Joi.string().max(20).optional().allow(''),
  email: Joi.string().email().max(255).optional().allow(''),
  website: Joi.string().uri().max(255).optional().allow(''),
  academicYearStartMonth: Joi.number().integer().min(1).max(12).optional(),
  academicYearDurationMonths: Joi.number().integer().min(1).max(24).optional(),
  termsPerYear: Joi.number().integer().min(1).max(6).optional(),
  defaultCalendarSystem: Joi.string().valid('BS', 'AD').optional(),
  defaultLanguage: Joi.string().valid('nepali', 'english').optional(),
  timezone: Joi.string().max(50).optional(),
  currency: Joi.string().max(10).optional(),
  dateFormat: Joi.string().max(50).optional(),
  timeFormat: Joi.string().max(50).optional(),
  numberFormat: Joi.string().max(50).optional(),
});

export const updateSchoolSchema = Joi.object({
  schoolNameEn: Joi.string().max(255).optional(),
  schoolNameNp: Joi.string().max(255).optional().allow(''),
  schoolCode: Joi.string().max(50).optional().allow(''),
  addressEn: Joi.string().optional().allow(''),
  addressNp: Joi.string().optional().allow(''),
  phone: Joi.string().max(20).optional().allow(''),
  email: Joi.string().email().max(255).optional().allow(''),
  website: Joi.string().uri().max(255).optional().allow(''),
  academicYearStartMonth: Joi.number().integer().min(1).max(12).optional(),
  academicYearDurationMonths: Joi.number().integer().min(1).max(24).optional(),
  termsPerYear: Joi.number().integer().min(1).max(6).optional(),
  defaultCalendarSystem: Joi.string().valid('BS', 'AD').optional(),
  defaultLanguage: Joi.string().valid('nepali', 'english').optional(),
  timezone: Joi.string().max(50).optional(),
  currency: Joi.string().max(10).optional(),
  dateFormat: Joi.string().max(50).optional(),
  timeFormat: Joi.string().max(50).optional(),
  numberFormat: Joi.string().max(50).optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

export const listSchoolsQuerySchema = Joi.object({
  includeInactive: Joi.boolean().truthy('true').falsy('false').default(false),
});

export const listUsersQuerySchema = Joi.object({
  role: Joi.string()
    .valid(...Object.values(UserRole))
    .optional(),
});

export const listIncidentsQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(20),
});

export const createSchoolAdminSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(50).required(),
  email: Joi.string().email().max(100).required(),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.pattern.base':
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    }),
  phoneNumber: Joi.string()
    .pattern(/^(\+977[-\s]?)?[0-9]{7,10}$/)
    .optional()
    .allow(''),
});
