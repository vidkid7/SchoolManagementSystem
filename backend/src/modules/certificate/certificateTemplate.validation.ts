/**
 * Certificate Template Validation Schemas
 * 
 * Input validation for certificate template operations
 * 
 * Requirements: 25.2
 */

import Joi from 'joi';

const certificateTypes = [
  'character',
  'transfer',
  'academic_excellence',
  'eca',
  'sports',
  'course_completion',
  'bonafide',
];

export const createTemplateSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(200)
    .required()
    .messages({
      'string.empty': 'Template name is required',
      'string.min': 'Template name must be at least 3 characters',
      'string.max': 'Template name must not exceed 200 characters',
    }),
  
  type: Joi.string()
    .valid(...certificateTypes)
    .required()
    .messages({
      'any.only': `Type must be one of: ${certificateTypes.join(', ')}`,
      'any.required': 'Certificate type is required',
    }),
  
  templateHtml: Joi.string()
    .min(10)
    .required()
    .messages({
      'string.empty': 'Template HTML is required',
      'string.min': 'Template HTML must be at least 10 characters',
    }),
  
  variables: Joi.array()
    .items(
      Joi.string()
        .pattern(/^[a-z_][a-z0-9_]*$/i)
        .messages({
          'string.pattern.base': 'Variable names must start with a letter or underscore and contain only letters, numbers, and underscores',
        })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one variable is required',
      'any.required': 'Variables array is required',
    }),
  
  isActive: Joi.boolean()
    .optional()
    .default(true),
});

export const updateTemplateSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(200)
    .optional()
    .messages({
      'string.min': 'Template name must be at least 3 characters',
      'string.max': 'Template name must not exceed 200 characters',
    }),
  
  type: Joi.string()
    .valid(...certificateTypes)
    .optional()
    .messages({
      'any.only': `Type must be one of: ${certificateTypes.join(', ')}`,
    }),
  
  templateHtml: Joi.string()
    .min(10)
    .optional()
    .messages({
      'string.min': 'Template HTML must be at least 10 characters',
    }),
  
  variables: Joi.array()
    .items(
      Joi.string()
        .pattern(/^[a-z_][a-z0-9_]*$/i)
        .messages({
          'string.pattern.base': 'Variable names must start with a letter or underscore and contain only letters, numbers, and underscores',
        })
    )
    .min(1)
    .optional()
    .messages({
      'array.min': 'At least one variable is required',
    }),
  
  isActive: Joi.boolean()
    .optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

export const getTemplatesQuerySchema = Joi.object({
  type: Joi.string()
    .valid(...certificateTypes)
    .optional(),
  
  isActive: Joi.boolean()
    .optional(),
  
  search: Joi.string()
    .max(200)
    .optional(),
});

export const templateIdParamSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Template ID must be a number',
      'number.positive': 'Template ID must be positive',
      'any.required': 'Template ID is required',
    }),
});

export const renderTemplateSchema = Joi.object({
  data: Joi.object()
    .pattern(Joi.string(), Joi.any())
    .required()
    .messages({
      'any.required': 'Template data is required',
    }),
});
