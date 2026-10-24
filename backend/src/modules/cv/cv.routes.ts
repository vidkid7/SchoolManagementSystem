import { NextFunction, Request, Response, Router } from 'express';
import { param } from 'express-validator';
import CVController from './cv.controller';
import { authenticate, authorize } from '@middleware/auth';
import { validateRequest } from '@middleware/validation';
import { cvUpdateValidation } from './cv.validation';
import { assertStudentAccess } from '@modules/security/studentAccess';
import { UserRole } from '@models/User.model';
import Student from '@models/Student.model';
import { NotFoundError } from '@middleware/errorHandler';

const router = Router();

const validateStudentId = validateRequest([
  param('id').isInt({ min: 1 }).withMessage('Student ID must be a positive integer'),
]);

const checkStudentScope = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = Number(req.params.id);
    await assertStudentAccess(req, studentId);
    const student = await Student.findByPk(studentId, { attributes: ['studentId'] });
    if (!student) throw new NotFoundError('Student');
    next();
  } catch (error) {
    next(error);
  }
};

const canViewStudentCV = authorize(
  UserRole.SCHOOL_ADMIN,
  UserRole.CLASS_TEACHER,
  UserRole.SUBJECT_TEACHER,
  UserRole.DEPARTMENT_HEAD,
  UserRole.PARENT,
  UserRole.STUDENT,
);

const canManageStudentCV = authorize(UserRole.SCHOOL_ADMIN, UserRole.STUDENT);

/**
 * CV Routes
 * All routes require authentication
 * Note: More specific routes must come before generic /:id route
 */

// Get CV data (must come before /:id)
router.get('/:id/data', authenticate, canViewStudentCV, validateStudentId, checkStudentScope, CVController.getCVData);

// Check regeneration need (must come before /:id)
router.get('/:id/needs-regeneration', authenticate, canViewStudentCV, validateStudentId, checkStudentScope, CVController.checkNeedsRegeneration);

// Download PDF (must come before /:id)
router.get('/:id/download', authenticate, canViewStudentCV, validateStudentId, checkStudentScope, CVController.downloadPDF);

// Regenerate PDF
router.post('/:id/regenerate', authenticate, canManageStudentCV, validateStudentId, checkStudentScope, CVController.regeneratePDF);

// Get/Update customization (generic /:id route comes last)
router.get('/:id', authenticate, canViewStudentCV, validateStudentId, checkStudentScope, CVController.getCustomization);
router.put('/:id', authenticate, canManageStudentCV, validateStudentId, checkStudentScope, validateRequest(cvUpdateValidation), CVController.updateCustomization);

export default router;
