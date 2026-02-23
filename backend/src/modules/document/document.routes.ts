/**
 * Document Routes
 * 
 * Route definitions for document management endpoints
 * 
 * Requirements: 27.1, 27.2, 27.3, 27.4, 27.5, 27.6, 27.7, 27.8
 */

import { Router } from 'express';
import { DocumentController } from './document.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/auth';
import multer from 'multer';
import { UserRole } from '../../models/User.model';

const router = Router();
const controller = new DocumentController();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

// All routes require authentication
router.use(authenticate);

// Document CRUD operations
router.post(
  '/',
  authorize(UserRole.SCHOOL_ADMIN, UserRole.CLASS_TEACHER, UserRole.SUBJECT_TEACHER),
  upload.single('file'),
  controller.uploadDocument
);

router.get(
  '/',
  controller.searchDocuments
);

router.get(
  '/statistics',
  authorize(UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT),
  controller.getStatistics
);

router.get(
  '/category/:category',
  controller.getDocumentsByCategory
);

router.get(
  '/:documentId',
  controller.getDocument
);

router.get(
  '/:documentId/preview',
  controller.previewDocument
);

router.get(
  '/:documentId/download',
  controller.downloadDocument
);

router.get(
  '/:documentId/versions',
  controller.getDocumentVersions
);

router.get(
  '/:documentId/access-logs',
  authorize(UserRole.SCHOOL_ADMIN),
  controller.getAccessLogs
);

router.put(
  '/:documentId',
  authorize(UserRole.SCHOOL_ADMIN, UserRole.CLASS_TEACHER, UserRole.SUBJECT_TEACHER),
  controller.updateDocument
);

router.post(
  '/:documentId/versions',
  authorize(UserRole.SCHOOL_ADMIN, UserRole.CLASS_TEACHER, UserRole.SUBJECT_TEACHER),
  upload.single('file'),
  controller.uploadVersion
);

router.post(
  '/:documentId/archive',
  authorize(UserRole.SCHOOL_ADMIN, UserRole.CLASS_TEACHER, UserRole.SUBJECT_TEACHER),
  controller.archiveDocument
);

router.delete(
  '/:documentId',
  authorize(UserRole.SCHOOL_ADMIN, UserRole.CLASS_TEACHER, UserRole.SUBJECT_TEACHER),
  controller.deleteDocument
);

export default router;