import { Router } from 'express';
import { authenticate, authorize } from '@middleware/auth';
import { UserRole } from '@models/User.model';
import { validate } from '@middleware/validation';
import lessonPlanController from './lessonPlan.controller';
import {
  createLessonPlanSchema,
  lessonPlanIdParamSchema,
  lessonPlanListQuerySchema,
  syllabusProgressListQuerySchema,
  updateLessonPlanSchema,
  updateLessonPlanStatusSchema,
  updateSyllabusProgressSchema,
} from './lessonPlan.validation';

const router = Router();

router.use(authenticate);

const TEACHER_ROLES = [UserRole.SCHOOL_ADMIN, UserRole.CLASS_TEACHER, UserRole.SUBJECT_TEACHER, UserRole.DEPARTMENT_HEAD];

// Dashboard
router.get('/dashboard', authorize(...TEACHER_ROLES), lessonPlanController.getDashboard);

// Syllabus progress (must be before /:id to avoid route conflict)
router.get('/syllabus-progress', authorize(...TEACHER_ROLES), validate(syllabusProgressListQuerySchema, 'query'), lessonPlanController.getSyllabusProgress);
router.post('/syllabus-progress', authorize(...TEACHER_ROLES), validate(updateSyllabusProgressSchema), lessonPlanController.updateSyllabusProgress);

// Lesson plan CRUD
router.get('/', authorize(...TEACHER_ROLES), validate(lessonPlanListQuerySchema, 'query'), lessonPlanController.getLessonPlans);
router.get('/:id', authorize(...TEACHER_ROLES), validate(lessonPlanIdParamSchema, 'params'), lessonPlanController.getLessonPlanById);
router.post('/', authorize(...TEACHER_ROLES), validate(createLessonPlanSchema), lessonPlanController.createLessonPlan);
router.put('/:id', authorize(...TEACHER_ROLES), validate(lessonPlanIdParamSchema, 'params'), validate(updateLessonPlanSchema), lessonPlanController.updateLessonPlan);
router.delete('/:id', authorize(...TEACHER_ROLES), validate(lessonPlanIdParamSchema, 'params'), lessonPlanController.deleteLessonPlan);
router.patch('/:id/status', authorize(...TEACHER_ROLES), validate(lessonPlanIdParamSchema, 'params'), validate(updateLessonPlanStatusSchema), lessonPlanController.updateStatus);

export default router;
