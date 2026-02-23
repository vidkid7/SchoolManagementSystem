import Joi from 'joi';
import { UserRole } from '@models/User.model';

/**
 * Password validation rules
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .required()
  .messages({
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    'string.min': 'Password must be at least 8 characters long',
    'string.max': 'Password must not exceed 128 characters'
  });

/**
 * Username validation rules
 * - 3-50 characters
 * - Alphanumeric only
 */
const usernameSchema = Joi.string()
  .min(3)
  .max(50)
  .alphanum()
  .required()
  .messages({
    'string.alphanum': 'Username must contain only letters and numbers',
    'string.min': 'Username must be at least 3 characters long',
    'string.max': 'Username must not exceed 50 characters'
  });

/**
 * Email validation
 */
const emailSchema = Joi.string()
  .email()
  .max(100)
  .required()
  .messages({
    'string.email': 'Please provide a valid email address',
    'string.max': 'Email must not exceed 100 characters'
  });

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
 * Register validation schema
 */
export const registerSchema = Joi.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Passwords do not match'
    }),
  role: Joi.string()
    .valid(...Object.values(UserRole))
    .required()
    .messages({
      'any.only': 'Invalid role specified'
    }),
  phoneNumber: phoneSchema
});

/**
 * Login validation schema
 */
export const loginSchema = Joi.object({
  username: Joi.string()
    .required()
    .messages({
      'any.required': 'Username or email is required'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    }),
  rememberMe: Joi.boolean().optional()
});

/**
 * Refresh token validation schema
 */
export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({
      'any.required': 'Refresh token is required'
    })
});

/**
 * Change password validation schema
 */
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required'
    }),
  newPassword: passwordSchema,
  confirmNewPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Passwords do not match'
    })
});

/**
 * Forgot password validation schema
 */
export const forgotPasswordSchema = Joi.object({
  email: emailSchema
});

/**
 * Reset password validation schema
 */
export const resetPasswordSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'any.required': 'Reset token is required'
    }),
  newPassword: passwordSchema,
  confirmNewPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Passwords do not match'
    })
});

/**
 * Update profile validation schema
 */
export const updateProfileSchema = Joi.object({
  phoneNumber: phoneSchema,
  profilePhoto: Joi.string()
    .uri()
    .optional()
    .messages({
      'string.uri': 'Profile photo must be a valid URL'
    })
});

export const authValidation = {
  register: registerSchema,
  login: loginSchema,
  refreshToken: refreshTokenSchema,
  changePassword: changePasswordSchema,
  forgotPassword: forgotPasswordSchema,
  resetPassword: resetPasswordSchema,
  updateProfile: updateProfileSchema
};
