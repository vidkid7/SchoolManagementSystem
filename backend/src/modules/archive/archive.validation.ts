import Joi from 'joi';

export const archiveAcademicYearSchema = Joi.object({
  academicYearId: Joi.number().integer().positive().required().messages({
    'number.base': 'Academic year ID must be a number',
    'number.positive': 'Academic year ID must be positive',
    'any.required': 'Academic year ID is required',
  }),
  academicYearName: Joi.string().max(100).required().messages({
    'string.base': 'Academic year name must be a string',
    'string.max': 'Academic year name cannot exceed 100 characters',
    'any.required': 'Academic year name is required',
  }),
});

export const archiveIdSchema = Joi.object({
  archiveId: Joi.number().integer().positive().required().messages({
    'number.base': 'Archive ID must be a number',
    'number.positive': 'Archive ID must be positive',
    'any.required': 'Archive ID is required',
  }),
});

export const getArchivesSchema = Joi.object({
  status: Joi.string().valid('in_progress', 'completed', 'failed', 'restored').optional(),
  academicYearId: Joi.number().integer().positive().optional(),
});
