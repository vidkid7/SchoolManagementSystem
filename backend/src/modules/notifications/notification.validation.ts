import Joi from 'joi';

const notificationCategories = [
  'attendance', 'exam', 'fee', 'grade', 'announcement', 'leave', 'library', 'general',
] as const;
const notificationTypes = ['info', 'warning', 'success', 'error'] as const;

export const notificationListQuerySchema = Joi.object({
  category: Joi.string().valid(...notificationCategories).optional(),
  type: Joi.string().valid(...notificationTypes).optional(),
  isRead: Joi.string().valid('true', 'false').optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
}).custom((value, helpers) => {
  if (value.startDate && value.endDate && value.startDate > value.endDate) {
    return helpers.error('any.custom', { message: 'startDate must be on or before endDate' });
  }
  return value;
}).messages({ 'any.custom': '{{#message}}' });

export const notificationCategoryQuerySchema = Joi.object({
  category: Joi.string().valid(...notificationCategories).optional(),
});

export const notificationIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});
