import { Router } from 'express';
import { authenticate, authorize } from '@middleware/auth';
import { UserRole } from '@models/User.model';
import lessonPlanController from './lessonPlan.controller';

const router = Router();

router.use(authenticate);

const TEACHER_ROLES = [UserRole.SCHOOL_ADMIN, UserRole.CLASS_TEACHER, UserRole.SUBJECT_TEACHER, UserRole.DEPARTMENT_HEAD];

// Dashboard
router.get('/dashboard', authorize(...TEACHER_ROLES), lessonPlanController.getDashboard);

// Syllabus progress (must be before /:id to avoid route conflict)
router.get('/syllabus-progress', authorize(...TEACHER_ROLES), lessonPlanController.getSyllabusProgress);
router.post('/syllabus-progress', authorize(...TEACHER_ROLES), lessonPlanController.updateSyllabusProgress);

// Lesson plan CRUD
router.get('/', authorize(...TEACHER_ROLES), lessonPlanController.getLessonPlans);
router.get('/:id', authorize(...TEACHER_ROLES), lessonPlanController.getLessonPlanById);
router.post('/', authorize(...TEACHER_ROLES), lessonPlanController.createLessonPlan);
router.put('/:id', authorize(...TEACHER_ROLES), lessonPlanController.updateLessonPlan);
router.delete('/:id', authorize(...TEACHER_ROLES), lessonPlanController.deleteLessonPlan);
router.patch('/:id/status', authorize(...TEACHER_ROLES), lessonPlanController.updateStatus);

export default router;
