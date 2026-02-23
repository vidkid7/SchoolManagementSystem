import Joi from 'joi';
import { PermissionCategory, PermissionAction } from '@models/Permission.model';

/**
 * Validation schema for creating a role
 */
export const createRoleSchema = Joi.object({
  name: Joi.string().min(3).max(100).required()
    .messages({
      'string.empty': 'Role name is required',
      'string.min': 'Role name must be at least 3 characters',
      'string.max': 'Role name must not exceed 100 characters',
    }),
  code: Joi.string().pattern(/^[A-Z_]+$/).min(3).max(50).required()
    .messages({
      'string.empty': 'Role code is required',
      'string.pattern.base': 'Role code must contain only uppercase letters and underscores',
      'string.min': 'Role code must be at least 3 characters',
      'string.max': 'Role code must not exceed 50 characters',
    }),
  description: Joi.string().max(500).optional()
    .messages({
      'string.max': 'Description must not exceed 500 characters',
    }),
});

/**
 * Validation schema for updating a role
 */
export const updateRoleSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional()
    .messages({
      'string.min': 'Role name must be at least 3 characters',
      'string.max': 'Role name must not exceed 100 characters',
    }),
  code: Joi.string().pattern(/^[A-Z_]+$/).min(3).max(50).optional()
    .messages({
      'string.pattern.base': 'Role code must contain only uppercase letters and underscores',
      'string.min': 'Role code must be at least 3 characters',
      'string.max': 'Role code must not exceed 50 characters',
    }),
  description: Joi.string().max(500).optional()
    .messages({
      'string.max': 'Description must not exceed 500 characters',
    }),
}).min(1);

/**
 * Validation schema for creating a permission
 */
export const createPermissionSchema = Joi.object({
  name: Joi.string().min(3).max(100).required()
    .messages({
      'string.empty': 'Permission name is required',
      'string.min': 'Permission name must be at least 3 characters',
      'string.max': 'Permission name must not exceed 100 characters',
    }),
  code: Joi.string().pattern(/^[a-z_]+$/).min(3).max(100).required()
    .messages({
      'string.empty': 'Permission code is required',
      'string.pattern.base': 'Permission code must contain only lowercase letters and underscores',
      'string.min': 'Permission code must be at least 3 characters',
      'string.max': 'Permission code must not exceed 100 characters',
    }),
  description: Joi.string().max(500).optional()
    .messages({
      'string.max': 'Description must not exceed 500 characters',
    }),
  category: Joi.string().valid(...Object.values(PermissionCategory)).required()
    .messages({
      'string.empty': 'Permission category is required',
      'any.only': 'Invalid permission category',
    }),
  action: Joi.string().valid(...Object.values(PermissionAction)).required()
    .messages({
      'string.empty': 'Permission action is required',
      'any.only': 'Invalid permission action',
    }),
  resource: Joi.string().min(3).max(100).required()
    .messages({
      'string.empty': 'Resource is required',
      'string.min': 'Resource must be at least 3 characters',
      'string.max': 'Resource must not exceed 100 characters',
    }),
});

/**
 * Validation schema for updating a permission
 */
export const updatePermissionSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional()
    .messages({
      'string.min': 'Permission name must be at least 3 characters',
      'string.max': 'Permission name must not exceed 100 characters',
    }),
  code: Joi.string().pattern(/^[a-z_]+$/).min(3).max(100).optional()
    .messages({
      'string.pattern.base': 'Permission code must contain only lowercase letters and underscores',
      'string.min': 'Permission code must be at least 3 characters',
      'string.max': 'Permission code must not exceed 100 characters',
    }),
  description: Joi.string().max(500).optional()
    .messages({
      'string.max': 'Description must not exceed 500 characters',
    }),
  category: Joi.string().valid(...Object.values(PermissionCategory)).optional()
    .messages({
      'any.only': 'Invalid permission category',
    }),
  action: Joi.string().valid(...Object.values(PermissionAction)).optional()
    .messages({
      'any.only': 'Invalid permission action',
    }),
  resource: Joi.string().min(3).max(100).optional()
    .messages({
      'string.min': 'Resource must be at least 3 characters',
      'string.max': 'Resource must not exceed 100 characters',
    }),
}).min(1);

/**
 * Validation schema for assigning permissions to a role
 */
export const assignPermissionsSchema = Joi.object({
  permissionIds: Joi.array().items(Joi.string().uuid()).min(1).required()
    .messages({
      'array.empty': 'At least one permission ID is required',
      'array.min': 'At least one permission ID is required',
      'string.guid': 'Invalid permission ID format',
    }),
});

/**
 * Validation schema for UUID parameter
 */
export const uuidParamSchema = Joi.object({
  id: Joi.string().uuid().required()
    .messages({
      'string.guid': 'Invalid ID format',
      'string.empty': 'ID is required',
    }),
});

/**
 * Validation schema for permission ID parameter
 */
export const permissionIdParamSchema = Joi.object({
  id: Joi.string().uuid().required()
    .messages({
      'string.guid': 'Invalid role ID format',
      'string.empty': 'Role ID is required',
    }),
  permissionId: Joi.string().uuid().required()
    .messages({
      'string.guid': 'Invalid permission ID format',
      'string.empty': 'Permission ID is required',
    }),
});
