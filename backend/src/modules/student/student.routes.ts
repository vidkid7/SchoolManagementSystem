import { Router } from 'express';
import studentController from './student.controller';
import { authenticate, authorize } from '@middleware/auth';
import { validate } from '@middleware/validation';
import { UserRole } from '@models/User.model';
import { photoUpload, documentUpload } from './photo.service';
import multer from 'multer';
import {
  createStudentSchema,
  updateStudentSchema,
  listStudentsQuerySchema,
  studentIdParamSchema,
  promoteStudentSchema,
  transferStudentSchema
} from './student.validation';

const router = Router();

// Excel file upload middleware for bulk import
const excelUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel files (.xlsx, .xls) are allowed.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

/**
 * @route   GET /api/v1/students/search/fuzzy
 * @desc    Fuzzy search students by name
 * @access  Private (School_Admin, Class_Teacher, Subject_Teacher)
 */
router.get(
  '/search/fuzzy',
  authenticate,
  authorize(
    UserRole.SCHOOL_ADMIN,
    UserRole.CLASS_TEACHER,
    UserRole.SUBJECT_TEACHER,
    UserRole.DEPARTMENT_HEAD
  ),
  studentController.fuzzySearch
);

/**
 * @route   POST /api/v1/students/detect-duplicates
 * @desc    Detect potential duplicate students
 * @access  Private (School_Admin)
 */
router.post(
  '/detect-duplicates',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  studentController.detectDuplicates
);

/**
 * @route   POST /api/v1/students/validate
 * @desc    Validate student data
 * @access  Private (School_Admin)
 */
router.post(
  '/validate',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  studentController.validateStudentData
);

/**
 * @route   GET /api/v1/students/roll-number/next
 * @desc    Get next available roll number for a class
 * @access  Private (School_Admin)
 */
router.get(
  '/roll-number/next',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  studentController.getNextRollNumber
);

/**
 * @route   GET /api/v1/students
 * @desc    Get all students with filters and pagination
 * @access  Private (School_Admin, Class_Teacher, Subject_Teacher)
 */
router.get(
  '/',
  authenticate,
  authorize(
    UserRole.SCHOOL_ADMIN,
    UserRole.CLASS_TEACHER,
    UserRole.SUBJECT_TEACHER,
    UserRole.DEPARTMENT_HEAD
  ),
  validate(listStudentsQuerySchema, 'query'),
  studentController.getAll
);

/**
 * @route   GET /api/v1/students/import-template
 * @desc    Download bulk import Excel template
 * @access  Private (School_Admin)
 */
router.get(
  '/import-template',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  studentController.getImportTemplate
);

/**
 * @route   POST /api/v1/students
 * @desc    Create a new student
 * @access  Private (School_Admin)
 */
router.post(
  '/',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  validate(createStudentSchema, 'body'),
  studentController.create
);

/**
 * @route   POST /api/v1/students/bulk-import
 * @desc    Bulk import students from Excel file
 * @access  Private (School_Admin)
 */
router.post(
  '/bulk-import',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  excelUpload.single('file'),
  studentController.bulkImport
);

/**
 * @route   GET /api/v1/students/me/attendance/summary
 * @desc    Get my attendance summary
 * @access  Private (Student)
 */
router.get(
  '/me/attendance/summary',
  authenticate,
  authorize(UserRole.STUDENT),
  studentController.getMyAttendanceSummary
);

/**
 * @route   GET /api/v1/students/me/grades
 * @desc    Get my grades
 * @access  Private (Student)
 */
router.get(
  '/me/grades',
  authenticate,
  authorize(UserRole.STUDENT),
  studentController.getMyGrades
);

/**
 * @route   GET /api/v1/students/me/fees/summary
 * @desc    Get my fees summary
 * @access  Private (Student)
 */
router.get(
  '/me/fees/summary',
  authenticate,
  authorize(UserRole.STUDENT),
  studentController.getMyFeesSummary
);

/**
 * @route   GET /api/v1/students/me/profile
 * @desc    Get my profile
 * @access  Private (Student)
 */
router.get(
  '/me/profile',
  authenticate,
  authorize(UserRole.STUDENT),
  studentController.getMyProfile
);

/**
 * @route   GET /api/v1/students/:id
 * @desc    Get student by ID
 * @access  Private (School_Admin, Class_Teacher, Subject_Teacher)
 */
router.get(
  '/:id',
  authenticate,
  authorize(
    UserRole.SCHOOL_ADMIN,
    UserRole.CLASS_TEACHER,
    UserRole.SUBJECT_TEACHER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.PARENT,
    UserRole.STUDENT
  ),
  validate(studentIdParamSchema, 'params'),
  studentController.getById
);

/**
 * @route   PUT /api/v1/students/:id
 * @desc    Update student by ID
 * @access  Private (School_Admin)
 */
router.put(
  '/:id',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  validate(studentIdParamSchema, 'params'),
  validate(updateStudentSchema, 'body'),
  studentController.update
);

/**
 * @route   DELETE /api/v1/students/:id
 * @desc    Soft delete student by ID
 * @access  Private (School_Admin)
 */
router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  validate(studentIdParamSchema, 'params'),
  studentController.delete
);

/**
 * @route   POST /api/v1/students/:id/promote
 * @desc    Promote student to next class
 * @access  Private (School_Admin)
 */
router.post(
  '/:id/promote',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  validate(studentIdParamSchema, 'params'),
  validate(promoteStudentSchema, 'body'),
  studentController.promote
);

/**
 * @route   POST /api/v1/students/:id/transfer
 * @desc    Transfer student to different section/class
 * @access  Private (School_Admin)
 */
router.post(
  '/:id/transfer',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  validate(studentIdParamSchema, 'params'),
  validate(transferStudentSchema, 'body'),
  studentController.transfer
);

/**
 * @route   POST /api/v1/students/:id/photo
 * @desc    Upload student photo
 * @access  Private (School_Admin)
 */
router.post(
  '/:id/photo',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  validate(studentIdParamSchema, 'params'),
  photoUpload.single('photo'),
  studentController.uploadPhoto
);

/**
 * @route   POST /api/v1/students/:id/documents
 * @desc    Upload student documents
 * @access  Private (School_Admin)
 */
router.post(
  '/:id/documents',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  validate(studentIdParamSchema, 'params'),
  documentUpload.array('documents', 5),
  studentController.uploadDocuments
);

/**
 * @route   GET /api/v1/students/:id/documents
 * @desc    List student documents
 * @access  Private (School_Admin, Class_Teacher)
 */
router.get(
  '/:id/documents',
  authenticate,
  authorize(
    UserRole.SCHOOL_ADMIN,
    UserRole.CLASS_TEACHER
  ),
  validate(studentIdParamSchema, 'params'),
  studentController.listDocuments
);

/**
 * @route   GET /api/v1/students/:id/history
 * @desc    Get student academic history
 * @access  Private (School_Admin, Class_Teacher, Parent, Student)
 */
router.get(
  '/:id/history',
  authenticate,
  authorize(
    UserRole.SCHOOL_ADMIN,
    UserRole.CLASS_TEACHER,
    UserRole.PARENT,
    UserRole.STUDENT
  ),
  validate(studentIdParamSchema, 'params'),
  studentController.getAcademicHistory
);

/**
 * @route   GET /api/v1/students/:id/attendance
 * @desc    Get student attendance records
 * @access  Private (School_Admin, Class_Teacher)
 */
router.get(
  '/:id/attendance',
  authenticate,
  authorize(
    UserRole.SCHOOL_ADMIN,
    UserRole.CLASS_TEACHER,
    UserRole.PARENT,
    UserRole.STUDENT
  ),
  validate(studentIdParamSchema, 'params'),
  studentController.getAttendance
);

/**
 * @route   GET /api/v1/students/:id/grades
 * @desc    Get student grades/marks
 * @access  Private (School_Admin, Class_Teacher, Parent, Student)
 */
router.get(
  '/:id/grades',
  authenticate,
  authorize(
    UserRole.SCHOOL_ADMIN,
    UserRole.CLASS_TEACHER,
    UserRole.PARENT,
    UserRole.STUDENT
  ),
  validate(studentIdParamSchema, 'params'),
  studentController.getGrades
);

/**
 * @route   GET /api/v1/students/:id/fees
 * @desc    Get student fee records
 * @access  Private (School_Admin, Class_Teacher, Parent, Student)
 */
router.get(
  '/:id/fees',
  authenticate,
  authorize(
    UserRole.SCHOOL_ADMIN,
    UserRole.CLASS_TEACHER,
    UserRole.PARENT,
    UserRole.STUDENT
  ),
  validate(studentIdParamSchema, 'params'),
  studentController.getFees
);

/**
 * @route   GET /api/v1/students/:id/eca
 * @desc    Get student ECA activities
 * @access  Private (School_Admin, Class_Teacher, Parent, Student)
 */
router.get(
  '/:id/eca',
  authenticate,
  authorize(
    UserRole.SCHOOL_ADMIN,
    UserRole.CLASS_TEACHER,
    UserRole.PARENT,
    UserRole.STUDENT
  ),
  validate(studentIdParamSchema, 'params'),
  studentController.getECA
);

/**
 * @route   GET /api/v1/students/:id/certificates
 * @desc    Get student certificates
 * @access  Private (School_Admin, Class_Teacher, Parent, Student)
 */
router.get(
  '/:id/certificates',
  authenticate,
  authorize(
    UserRole.SCHOOL_ADMIN,
    UserRole.CLASS_TEACHER,
    UserRole.PARENT,
    UserRole.STUDENT
  ),
  validate(studentIdParamSchema, 'params'),
  studentController.getCertificates
);

/**
 * @route   GET /api/v1/students/:id/remarks
 * @desc    Get student remarks from teachers
 * @access  Private (School_Admin, Class_Teacher, Parent, Student)
 */
router.get(
  '/:id/remarks',
  authenticate,
  authorize(
    UserRole.SCHOOL_ADMIN,
    UserRole.CLASS_TEACHER,
    UserRole.PARENT,
    UserRole.STUDENT
  ),
  validate(studentIdParamSchema, 'params'),
  studentController.getRemarks
);

/**
 * @route   GET /api/v1/students/:id/library
 * @desc    Get student library borrowing records
 * @access  Private (School_Admin, Class_Teacher, Parent, Student, Librarian)
 */
router.get(
  '/:id/library',
  authenticate,
  authorize(
    UserRole.SCHOOL_ADMIN,
    UserRole.CLASS_TEACHER,
    UserRole.PARENT,
    UserRole.STUDENT
  ),
  validate(studentIdParamSchema, 'params'),
  studentController.getLibrary
);

/**
 * @route   GET /api/v1/students/:id/siblings
 * @desc    Find potential siblings of a student
 * @access  Private (School_Admin, Class_Teacher)
 */
router.get(
  '/:id/siblings',
  authenticate,
  authorize(
    UserRole.SCHOOL_ADMIN,
    UserRole.CLASS_TEACHER
  ),
  validate(studentIdParamSchema, 'params'),
  studentController.findSiblings
);

export default router;

 
