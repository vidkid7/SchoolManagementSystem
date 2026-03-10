import { Router } from 'express';
import { authenticate, authorize } from '@middleware/auth';
import { UserRole } from '@models/User.model';
import assignmentController from './assignment.controller';

const router = Router();

router.use(authenticate);

const TEACHER_ROLES = [
  UserRole.SCHOOL_ADMIN,
  UserRole.CLASS_TEACHER,
  UserRole.SUBJECT_TEACHER,
  UserRole.DEPARTMENT_HEAD,
];

const ALL_ROLES = [
  ...TEACHER_ROLES,
  UserRole.STUDENT,
  UserRole.PARENT,
];

// Dashboard
router.get(
  '/dashboard',
  authorize(...TEACHER_ROLES),
  assignmentController.getDashboard
);

// List all assignments
router.get(
  '/',
  authorize(...ALL_ROLES),
  assignmentController.getAssignments
);

// Student's own assignments (must be BEFORE /:id)
router.get(
  '/my',
  authorize(UserRole.STUDENT),
  assignmentController.getMyAssignments
);

// Single assignment
router.get(
  '/:id',
  authorize(...ALL_ROLES),
  assignmentController.getAssignmentById
);

// Create assignment
router.post(
  '/',
  authorize(...TEACHER_ROLES),
  assignmentController.createAssignment
);

// Update assignment
router.put(
  '/:id',
  authorize(...TEACHER_ROLES),
  assignmentController.updateAssignment
);

// Delete assignment
router.delete(
  '/:id',
  authorize(...TEACHER_ROLES),
  assignmentController.deleteAssignment
);

// Get submissions for an assignment
router.get(
  '/:id/submissions',
  authorize(...TEACHER_ROLES),
  assignmentController.getSubmissions
);

// Student submits work
router.post(
  '/:id/submit',
  authorize(UserRole.STUDENT),
  assignmentController.submitAssignment
);

// Grade a submission
router.put(
  '/submissions/:submissionId/grade',
  authorize(...TEACHER_ROLES),
  assignmentController.gradeSubmission
);

export default router;
