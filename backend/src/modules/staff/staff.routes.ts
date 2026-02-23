import { Router } from 'express';
import staffController from './staff.controller';
import { authenticate, authorize } from '@middleware/auth';
import { UserRole } from '@models/User.model';
import { photoUpload } from '@modules/student/photo.service';
import { staffDocumentUpload } from './staffDocument.service';

const router = Router();

/**
 * @route   GET /api/v1/staff
 * @desc    Get all staff
 * @access  Private (School_Admin)
 */
router.get(
  '/',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  staffController.getAll
);

/**
 * @route   GET /api/v1/staff/statistics
 * @desc    Get staff statistics
 * @access  Private (School_Admin)
 */
router.get(
  '/statistics',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  staffController.getStatistics
);

/**
 * @route   GET /api/v1/staff/:id
 * @desc    Get staff by ID
 * @access  Private (School_Admin)
 */
router.get(
  '/:id',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  staffController.getById
);

/**
 * @route   POST /api/v1/staff
 * @desc    Create staff
 * @access  Private (School_Admin)
 */
router.post(
  '/',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  staffController.create
);

/**
 * @route   PUT /api/v1/staff/:id
 * @desc    Update staff
 * @access  Private (School_Admin)
 */
router.put(
  '/:id',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  staffController.update
);

/**
 * @route   DELETE /api/v1/staff/:id
 * @desc    Delete staff
 * @access  Private (School_Admin)
 */
router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  staffController.delete
);

/**
 * @route   POST /api/v1/staff/:id/assign
 * @desc    Assign staff to class/subject
 * @access  Private (School_Admin)
 */
router.post(
  '/:id/assign',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  staffController.assign
);

/**
 * @route   GET /api/v1/staff/:id/assignments
 * @desc    Get staff assignments
 * @access  Private (School_Admin)
 */
router.get(
  '/:id/assignments',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  staffController.getAssignments
);

/**
 * @route   PUT /api/v1/staff/assignments/:assignmentId/end
 * @desc    End staff assignment
 * @access  Private (School_Admin)
 */
router.put(
  '/assignments/:assignmentId/end',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  staffController.endAssignment
);

/**
 * @route   DELETE /api/v1/staff/assignments/:assignmentId
 * @desc    Delete staff assignment
 * @access  Private (School_Admin)
 */
router.delete(
  '/assignments/:assignmentId',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  staffController.deleteAssignment
);

/**
 * @route   GET /api/v1/staff/class/:classId/teacher
 * @desc    Get class teacher
 * @access  Private (School_Admin, Class_Teacher)
 */
router.get(
  '/class/:classId/teacher',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN, UserRole.CLASS_TEACHER),
  staffController.getClassTeacher
);

/**
 * @route   GET /api/v1/staff/class/:classId/subject/:subjectId/teachers
 * @desc    Get subject teachers for a class
 * @access  Private (School_Admin, Class_Teacher)
 */
router.get(
  '/class/:classId/subject/:subjectId/teachers',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN, UserRole.CLASS_TEACHER),
  staffController.getSubjectTeachers
);

/**
 * @route   POST /api/v1/staff/:id/photo
 * @desc    Upload staff photo
 * @access  Private (School_Admin)
 */
router.post(
  '/:id/photo',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  photoUpload.single('photo'),
  staffController.uploadPhoto
);

/**
 * @route   POST /api/v1/staff/:id/documents
 * @desc    Upload staff document
 * @access  Private (School_Admin)
 */
router.post(
  '/:id/documents',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  staffDocumentUpload.single('document'),
  staffController.uploadDocument
);

/**
 * @route   POST /api/v1/staff/:id/documents/bulk
 * @desc    Bulk upload staff documents
 * @access  Private (School_Admin)
 */
router.post(
  '/:id/documents/bulk',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  staffDocumentUpload.array('documents', 10),
  staffController.bulkUploadDocuments
);

/**
 * @route   GET /api/v1/staff/:id/documents
 * @desc    Get staff documents
 * @access  Private (School_Admin)
 */
router.get(
  '/:id/documents',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  staffController.getDocuments
);

/**
 * @route   GET /api/v1/staff/:id/documents/statistics
 * @desc    Get document statistics for staff
 * @access  Private (School_Admin)
 */
router.get(
  '/:id/documents/statistics',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  staffController.getDocumentStatistics
);

/**
 * @route   GET /api/v1/staff/:id/documents/versions
 * @desc    Get document versions
 * @access  Private (School_Admin)
 */
router.get(
  '/:id/documents/versions',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  staffController.getDocumentVersions
);

/**
 * @route   GET /api/v1/staff/:id/documents/expired
 * @desc    Get expired documents for staff
 * @access  Private (School_Admin)
 */
router.get(
  '/:id/documents/expired',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  staffController.getExpiredDocuments
);

/**
 * @route   GET /api/v1/staff/:id/documents/expiring-soon
 * @desc    Get documents expiring soon for staff
 * @access  Private (School_Admin)
 */
router.get(
  '/:id/documents/expiring-soon',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  staffController.getDocumentsExpiringSoon
);

/**
 * @route   GET /api/v1/staff/documents/:documentId
 * @desc    Get document by ID
 * @access  Private (School_Admin)
 */
router.get(
  '/documents/:documentId',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  staffController.getDocumentById
);

/**
 * @route   PUT /api/v1/staff/documents/:documentId
 * @desc    Update document metadata
 * @access  Private (School_Admin)
 */
router.put(
  '/documents/:documentId',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  staffController.updateDocument
);

/**
 * @route   DELETE /api/v1/staff/documents/:documentId
 * @desc    Delete document
 * @access  Private (School_Admin)
 */
router.delete(
  '/documents/:documentId',
  authenticate,
  authorize(UserRole.SCHOOL_ADMIN),
  staffController.deleteDocument
);

export default router;
