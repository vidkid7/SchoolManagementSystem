/**
 * Document Validation Schemas
 * 
 * Input validation for document management endpoints
 * 
 * Requirements: 27.1, 27.2, 27.3, 27.5, 27.6, 27.7, 27.8
 */

import Joi from 'joi';

// Document categories
const documentCategories = [
  'academic',
  'administrative',
  'financial',
  'student_record',
  'staff_record',
  'curriculum',
  'exam',
  'other',
];

// Access levels
const accessLevels = ['private', 'restricted', 'public'];

// Actions for access logs
const accessActions = ['view', 'download', 'edit', 'delete', 'share', 'upload', 'preview'];

// Upload validation schema
export const uploadDocumentSchema = Joi.object({
  name: Joi.string().max(255).required(),
  description: Joi.string().max(2000).optional(),
  category: Joi.string()
    .valid(...documentCategories)
    .required(),
  accessLevel: Joi.string()
    .valid(...accessLevels)
    .optional()
    .default('private'),
  allowedRoles: Joi.array()
    .items(Joi.string())
    .optional(),
  allowedUserIds: Joi.array()
    .items(Joi.number().integer().positive())
    .optional(),
  tags: Joi.array()
    .items(Joi.string().max(50))
    .optional(),
  metadata: Joi.object().optional(),
});

// Update validation schema
export const updateDocumentSchema = Joi.object({
  name: Joi.string().max(255).optional(),
  description: Joi.string().max(2000).optional(),
  category: Joi.string()
    .valid(...documentCategories)
    .optional(),
  accessLevel: Joi.string()
    .valid(...accessLevels)
    .optional(),
  allowedRoles: Joi.array()
    .items(Joi.string())
    .optional(),
  allowedUserIds: Joi.array()
    .items(Joi.number().integer().positive())
    .optional(),
  tags: Joi.array()
    .items(Joi.string().max(50))
    .optional(),
  metadata: Joi.object().optional(),
}).min(1);

// Search/filter validation schema
export const documentFiltersSchema = Joi.object({
  category: Joi.string()
    .valid(...documentCategories)
    .optional(),
  status: Joi.string()
    .valid('active', 'archived', 'deleted')
    .optional(),
  accessLevel: Joi.string()
    .valid(...accessLevels)
    .optional(),
  uploadedBy: Joi.number()
    .integer()
    .positive()
    .optional(),
  search: Joi.string()
    .max(255)
    .optional(),
  tags: Joi.array()
    .items(Joi.string().max(50))
    .optional(),
  startDate: Joi.date()
    .optional(),
  endDate: Joi.date()
    .optional(),
  page: Joi.number()
    .integer()
    .positive()
    .optional()
    .default(1),
  limit: Joi.number()
    .integer()
    .positive()
    .max(100)
    .optional()
    .default(20),
});

// Access log filters schema
export const accessLogFiltersSchema = Joi.object({
  documentId: Joi.number()
    .integer()
    .positive()
    .optional(),
  userId: Joi.number()
    .integer()
    .positive()
    .optional(),
  action: Joi.string()
    .valid(...accessActions)
    .optional(),
  startDate: Joi.date()
    .optional(),
  endDate: Joi.date()
    .optional(),
});

// Params validation schemas
export const documentParamsSchema = Joi.object({
  documentId: Joi.number()
    .integer()
    .positive()
    .required(),
});

// Document number schema
export const documentNumberSchema = Joi.object({
  documentNumber: Joi.string()
    .max(50)
    .required(),
});

// Pagination schema
export const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .positive()
    .optional()
    .default(1),
  limit: Joi.number()
    .integer()
    .positive()
    .max(100)
    .optional()
    .default(20),
});

// Validation helper functions
export const validate = (schema: Joi.ObjectSchema) => {
  return (data: any): { value: any; error?: Joi.ValidationError } => {
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });
    return { value, error };
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (data: any): { value: any; error?: Joi.ValidationError } => {
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });
    return { value, error };
  };
};

export const validateParams = (schema: Joi.ObjectSchema) => {
  return (data: any): { value: any; error?: Joi.ValidationError } => {
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });
    return { value, error };
  };
};

// File upload validation
export const fileUploadValidation = {
  // Max file size: 10MB
  maxFileSize: 10 * 1024 * 1024,
  
  // Allowed MIME types
  allowedMimeTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
    'text/csv',
    'text/html',
    'application/zip',
    'application/x-zip-compressed',
  ],
  
  // Image MIME types (for compression)
  imageMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ],
};

export default {
  uploadDocumentSchema,
  updateDocumentSchema,
  documentFiltersSchema,
  accessLogFiltersSchema,
  documentParamsSchema,
  documentNumberSchema,
  paginationSchema,
  validate,
  validateQuery,
  validateParams,
  fileUploadValidation,
};