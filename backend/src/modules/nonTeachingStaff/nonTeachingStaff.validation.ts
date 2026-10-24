import Joi from 'joi';

export const staffLeaveRequestSchema = Joi.object({
  leaveType: Joi.string().valid('casual', 'sick', 'personal', 'other').required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
  reason: Joi.string().trim().min(10).max(1000).required(),
});

export const staffLeaveRequestIdSchema = Joi.object({
  requestId: Joi.number().integer().positive().required(),
});

export const staffTaskIdSchema = Joi.object({
  taskId: Joi.number().integer().positive().required(),
});

export const staffTaskQuerySchema = Joi.object({
  status: Joi.string().valid('pending', 'in_progress', 'completed').optional(),
}).unknown(false);

export const staffTaskSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().allow('').max(10000).optional(),
  assignedTo: Joi.number().integer().positive().required(),
  dueDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow(null).optional(),
  priority: Joi.string().valid('low', 'medium', 'high').optional(),
  category: Joi.string().trim().max(100).optional(),
}).unknown(false);

export const staffTaskStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'in_progress', 'completed').required(),
  completionNote: Joi.string().allow('').max(10000).optional(),
}).unknown(false);

export const staffScheduleQuerySchema = Joi.object({
  week: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).unknown(false);

export const staffScheduleSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  shiftStart: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/).optional(),
  shiftEnd: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/).optional(),
  location: Joi.string().allow('').max(200).optional(),
  notes: Joi.string().allow('').max(10000).optional(),
}).unknown(false);
