import Joi from 'joi';

const dateOnly = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).custom((value, helpers) => {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value
    ? helpers.error('date.format')
    : value;
}).messages({ 'date.format': '{{#label}} must be a valid YYYY-MM-DD date' });

export const behaviorRecordCreateSchema = Joi.object({
  studentId: Joi.number().integer().positive().required(),
  type: Joi.string().valid('positive', 'negative', 'neutral').default('neutral'),
  category: Joi.string().trim().min(1).max(100).required(),
  description: Joi.string().trim().min(1).max(10000).required(),
  actionTaken: Joi.string().allow('').max(10000).optional(),
  date: dateOnly.optional(),
});
