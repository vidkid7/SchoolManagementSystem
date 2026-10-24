import Joi from 'joi';

const lessonPlanStatuses = ['draft', 'scheduled', 'completed', 'reviewed', 'approved'] as const;
const syllabusProgressStatuses = ['not-started', 'in-progress', 'completed'] as const;

const lessonPlanFields = {
  subject: Joi.string().trim().min(1).max(100),
  className: Joi.string().trim().max(50).allow('', null),
  section: Joi.string().trim().max(50).allow('', null),
  topic: Joi.string().trim().min(1).max(255),
  date: Joi.date().iso(),
  duration: Joi.number().integer().min(1).max(1440),
  objectives: Joi.array().items(Joi.string().trim().max(1000)).max(50),
  materials: Joi.string().trim().max(5000).allow('', null),
  methodology: Joi.string().trim().max(5000).allow('', null),
  assessment: Joi.string().trim().max(5000).allow('', null),
  status: Joi.string().valid(...lessonPlanStatuses),
};

export const lessonPlanListQuerySchema = Joi.object({
  subject: Joi.string().trim().max(100).optional(),
  className: Joi.string().trim().max(50).optional(),
  status: Joi.string().valid(...lessonPlanStatuses).optional(),
  teacherId: Joi.number().integer().positive().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

export const lessonPlanIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

export const createLessonPlanSchema = Joi.object({
  ...lessonPlanFields,
  subject: lessonPlanFields.subject.required(),
  topic: lessonPlanFields.topic.required(),
  date: Joi.date().iso().allow('', null).optional(),
});

export const updateLessonPlanSchema = Joi.object(lessonPlanFields).min(1);

export const updateLessonPlanStatusSchema = Joi.object({
  status: Joi.string().valid(...lessonPlanStatuses).required(),
});

export const syllabusProgressListQuerySchema = Joi.object({
  subject: Joi.string().trim().max(100).optional(),
  className: Joi.string().trim().max(50).optional(),
  teacherId: Joi.number().integer().positive().optional(),
});

export const updateSyllabusProgressSchema = Joi.object({
  subject: Joi.string().trim().min(1).max(100).required(),
  className: Joi.string().trim().max(50).allow('', null).optional(),
  unit: Joi.string().trim().min(1).max(255).required(),
  topic: Joi.string().trim().max(255).allow('', null).optional(),
  status: Joi.string().valid(...syllabusProgressStatuses).optional(),
  progress: Joi.number().integer().min(0).max(100).optional(),
});
