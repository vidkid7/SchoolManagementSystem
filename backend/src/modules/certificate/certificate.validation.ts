/**
 * Certificate Validation
 * 
 * Joi validation schemas for certificate operations
 * 
 * Requirements: 25.1, 25.3, 25.4, 25.5
 */

import Joi from 'joi';

/**
 * Validation schema for generating a certificate
 */
export const generateCertificateSchema = Joi.object({
  templateId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Template ID must be a number',
      'number.positive': 'Template ID must be positive',
      'any.required': 'Template ID is required',
    }),

  studentId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Student ID must be a number',
      'number.positive': 'Student ID must be positive',
      'any.required': 'Student ID is required',
    }),

  data: Joi.object()
    .required()
    .messages({
      'object.base': 'Data must be an object',
      'any.required': 'Data is required',
    }),

  issuedDate: Joi.date()
    .optional()
    .messages({
      'date.base': 'Issued date must be a valid date',
    }),

  issuedDateBS: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Issued date BS must be in format YYYY-MM-DD',
    }),
});

/**
 * Validation schema for bulk certificate generation
 */
export const bulkGenerateCertificatesSchema = Joi.object({
  templateId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Template ID must be a number',
      'number.positive': 'Template ID must be positive',
      'any.required': 'Template ID is required',
    }),

  students: Joi.array()
    .items(
      Joi.object({
        studentId: Joi.number()
          .integer()
          .positive()
          .required()
          .messages({
            'number.base': 'Student ID must be a number',
            'number.positive': 'Student ID must be positive',
            'any.required': 'Student ID is required',
          }),

        data: Joi.object()
          .required()
          .messages({
            'object.base': 'Data must be an object',
            'any.required': 'Data is required',
          }),
      })
    )
    .min(1)
    .required()
    .messages({
      'array.base': 'Students must be an array',
      'array.min': 'At least one student is required',
      'any.required': 'Students array is required',
    }),

  issuedDate: Joi.date()
    .optional()
    .messages({
      'date.base': 'Issued date must be a valid date',
    }),

  issuedDateBS: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Issued date BS must be in format YYYY-MM-DD',
    }),
});

/**
 * Validation schema for revoking a certificate
 */
export const revokeCertificateSchema = Joi.object({
  reason: Joi.string()
    .min(10)
    .max(500)
    .required()
    .messages({
      'string.base': 'Reason must be a string',
      'string.min': 'Reason must be at least 10 characters',
      'string.max': 'Reason must not exceed 500 characters',
      'any.required': 'Reason is required',
    }),
});

/**
 * Validation schema for certificate filters
 */
export const certificateFiltersSchema = Joi.object({
  studentId: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'Student ID must be a number',
      'number.positive': 'Student ID must be positive',
    }),

  type: Joi.string()
    .valid(
      'character',
      'transfer',
      'academic_excellence',
      'eca',
      'sports',
      'course_completion',
      'bonafide',
      'conduct',
      'participation'
    )
    .optional()
    .messages({
      'string.base': 'Type must be a string',
      'any.only': 'Invalid certificate type',
    }),

  status: Joi.string()
    .valid('active', 'revoked')
    .optional()
    .messages({
      'string.base': 'Status must be a string',
      'any.only': 'Status must be either active or revoked',
    }),

  issuedDateFrom: Joi.date()
    .optional()
    .messages({
      'date.base': 'Issued date from must be a valid date',
    }),

  issuedDateTo: Joi.date()
    .optional()
    .messages({
      'date.base': 'Issued date to must be a valid date',
    }),

  search: Joi.string()
    .optional()
    .messages({
      'string.base': 'Search must be a string',
    }),
});

/**
 * Validation schema for certificate number parameter
 * Requirements: 25.7
 */
export const certificateNumberSchema = Joi.object({
  certificateNumber: Joi.string()
    .pattern(/^CERT-[A-Z]{4}-\d{4}-\d{4}$/)
    .required()
    .messages({
      'string.base': 'Certificate number must be a string',
      'string.pattern.base': 'Invalid certificate number format. Expected format: CERT-XXXX-YYYY-NNNN',
      'any.required': 'Certificate number is required',
    }),
});

/**
 * Middleware to validate request body
 */
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors,
        },
      });
    }

    next();
  };
};

/**
 * Middleware to validate query parameters
 */
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors,
        },
      });
    }

    next();
  };
};

/**
 * Middleware to validate route parameters
 * Requirements: 25.7
 */
export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors,
        },
      });
    }

    next();
  };
};
