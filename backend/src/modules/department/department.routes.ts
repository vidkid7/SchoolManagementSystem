import { Router } from 'express';
import { authenticate, authorize } from '@middleware/auth';
import { UserRole } from '@models/User.model';
import * as departmentController from './department.controller';

const router = Router();

router.use(authenticate);

const DEPT_HEAD_ROLES = [UserRole.SCHOOL_ADMIN, UserRole.DEPARTMENT_HEAD];

/**
 * @route   GET /api/v1/department/teachers
 * @desc    Get department teachers
 * @access  Private (Department_Head, School_Admin)
 */
router.get(
  '/teachers',
  authorize(...DEPT_HEAD_ROLES),
  departmentController.getDepartmentTeachers
);

/**
 * @route   GET /api/v1/department/stats
 * @desc    Get department statistics
 * @access  Private (Department_Head, School_Admin)
 */
router.get(
  '/stats',
  authorize(...DEPT_HEAD_ROLES),
  departmentController.getDepartmentStats
);

/**
 * @route   GET /api/v1/department/performance
 * @desc    Get department performance
 * @access  Private (Department_Head, School_Admin)
 */
router.get(
  '/performance',
  authorize(...DEPT_HEAD_ROLES),
  departmentController.getDepartmentPerformance
);

export default router;
