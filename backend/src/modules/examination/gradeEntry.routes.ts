import { Router } from 'express';
import gradeEntryController from './gradeEntry.controller';
import { authenticate, authorize } from '@middleware/auth';
import { UserRole } from '@models/User.model';
import {
  createGradeEntryValidation,
  updateGradeEntryValidation,
  bulkGradeEntryValidation,
  weightedGradeValidation,
  getGradeByIdValidation,
  getGradesByExamValidation,
  getGradesByStudentValidation,
  getGradeByStudentAndExamValidation,
  deleteGradeValidation,
  getExamStatisticsValidation,
  bulkImportExcelValidation
} from './gradeEntry.validation';
import multer from 'multer';

/**
 * Grade Entry Routes
 * 
 * Requirements: 7.6, 7.9, N1.1
 */

const router = Router();

router.use(authenticate);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xls, .xlsx) are allowed'));
    }
  }
});

const teacherRoles = [
  UserRole.SCHOOL_ADMIN,
  UserRole.CLASS_TEACHER,
  UserRole.SUBJECT_TEACHER
];

const viewRoles = [
  UserRole.SCHOOL_ADMIN,
  UserRole.CLASS_TEACHER,
  UserRole.SUBJECT_TEACHER,
  UserRole.DEPARTMENT_HEAD,
  UserRole.STUDENT,
  UserRole.PARENT
];

/**
 * @route   POST /api/v1/grades
 * @access  Private (Teacher, Admin)
 */
router.post(
  '/',
  authorize(...teacherRoles),
  createGradeEntryValidation,
  gradeEntryController.createGradeEntry
);

/**
 * @route   PUT /api/v1/grades/:gradeId
 * @access  Private (Teacher, Admin)
 */
router.put(
  '/:gradeId',
  authorize(...teacherRoles),
  updateGradeEntryValidation,
  gradeEntryController.updateGradeEntry
);

/**
 * @route   POST /api/v1/grades/bulk
 * @access  Private (Teacher, Admin)
 */
router.post(
  '/bulk',
  authorize(...teacherRoles),
  bulkGradeEntryValidation,
  gradeEntryController.bulkGradeEntry
);

/**
 * @route   POST /api/v1/grades/import/excel
 * @access  Private (Teacher, Admin)
 */
router.post(
  '/import/excel',
  authorize(...teacherRoles),
  upload.single('file'),
  bulkImportExcelValidation,
  gradeEntryController.bulkImportExcel
);

/**
 * @route   POST /api/v1/grades/weighted
 * @access  Private (Teacher, Admin)
 */
router.post(
  '/weighted',
  authorize(...teacherRoles),
  weightedGradeValidation,
  gradeEntryController.calculateWeightedGrades
);

/**
 * @route   GET /api/v1/grades/student-exam
 * @access  Private (Teacher, Admin, Student, Parent)
 */
router.get(
  '/student-exam',
  authorize(...viewRoles),
  getGradeByStudentAndExamValidation,
  gradeEntryController.getGradeByStudentAndExam
);

/**
 * @route   GET /api/v1/grades/exam/:examId
 * @access  Private (Teacher, Admin)
 */
router.get(
  '/exam/:examId',
  authorize(UserRole.SCHOOL_ADMIN, UserRole.CLASS_TEACHER, UserRole.SUBJECT_TEACHER, UserRole.DEPARTMENT_HEAD),
  getGradesByExamValidation,
  gradeEntryController.getGradesByExam
);

/**
 * @route   GET /api/v1/grades/student/:studentId
 * @access  Private (Teacher, Admin, Student, Parent)
 */
router.get(
  '/student/:studentId',
  authorize(...viewRoles),
  getGradesByStudentValidation,
  gradeEntryController.getGradesByStudent
);

/**
 * @route   GET /api/v1/grades/exam/:examId/statistics
 * @access  Private (Teacher, Admin)
 */
router.get(
  '/exam/:examId/statistics',
  authorize(UserRole.SCHOOL_ADMIN, UserRole.CLASS_TEACHER, UserRole.SUBJECT_TEACHER, UserRole.DEPARTMENT_HEAD),
  getExamStatisticsValidation,
  gradeEntryController.getExamStatistics
);

/**
 * @route   GET /api/v1/grades/:gradeId
 * @access  Private (Teacher, Admin, Student, Parent)
 */
router.get(
  '/:gradeId',
  authorize(...viewRoles),
  getGradeByIdValidation,
  gradeEntryController.getGradeById
);

/**
 * @route   DELETE /api/v1/grades/:gradeId
 * @access  Private (Admin)
 */
router.delete(
  '/:gradeId',
  authorize(UserRole.SCHOOL_ADMIN),
  deleteGradeValidation,
  gradeEntryController.deleteGrade
);

export default router;
