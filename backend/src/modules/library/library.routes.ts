/**
 * Library Routes
 * 
 * Defines API endpoints for library management
 * 
 * Requirements: 10.1-10.13
 */

import { Router } from 'express';
import { libraryController } from './library.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import { UserRole } from '../../models/User.model';
import { libraryValidation } from './library.validation';

const router = Router();

router.use(authenticate);

const readRoles = [
  UserRole.SCHOOL_ADMIN,
  UserRole.LIBRARIAN,
  UserRole.CLASS_TEACHER,
  UserRole.SUBJECT_TEACHER,
  UserRole.DEPARTMENT_HEAD,
  UserRole.STUDENT,
  UserRole.PARENT
];

const manageRoles = [UserRole.SCHOOL_ADMIN, UserRole.LIBRARIAN];

// ==================== Dashboard ====================

router.get(
  '/statistics',
  authorize(...manageRoles),
  libraryController.getStatistics.bind(libraryController)
);

router.get(
  '/recent-activities',
  authorize(...manageRoles),
  libraryController.getRecentActivities.bind(libraryController)
);

// ==================== Book Management ====================

router.get(
  '/books',
  authorize(...readRoles),
  libraryController.getBooks.bind(libraryController)
);

router.get(
  '/books/:id',
  authorize(...readRoles),
  libraryController.getBookById.bind(libraryController)
);

router.post(
  '/books',
  authorize(...manageRoles),
  validate(libraryValidation.createBook),
  libraryController.createBook.bind(libraryController)
);

// ==================== Circulation Routes ====================

router.post(
  '/issue',
  authorize(...manageRoles),
  validate(libraryValidation.issueBook),
  libraryController.issueBook.bind(libraryController)
);

router.post(
  '/return',
  authorize(...manageRoles),
  validate(libraryValidation.returnBook),
  libraryController.returnBook.bind(libraryController)
);

router.post(
  '/renew',
  authorize(...readRoles),
  validate(libraryValidation.renewBook),
  libraryController.renewBook.bind(libraryController)
);

router.get(
  '/issued',
  authorize(...manageRoles),
  libraryController.getIssuedBooks.bind(libraryController)
);

router.get(
  '/overdue',
  authorize(...manageRoles),
  libraryController.getOverdueBooks.bind(libraryController)
);

// ==================== Reservation Routes ====================

router.post(
  '/reserve',
  authorize(...readRoles),
  validate(libraryValidation.reserveBook),
  libraryController.reserveBook.bind(libraryController)
);

router.get(
  '/reservations',
  authorize(...readRoles),
  libraryController.getReservations.bind(libraryController)
);

router.put(
  '/reservations/:id/cancel',
  authorize(...readRoles),
  libraryController.cancelReservation.bind(libraryController)
);

// ==================== Fine Management Routes ====================

router.get(
  '/fines/:studentId',
  authorize(...readRoles),
  libraryController.getFinesByStudent.bind(libraryController)
);

router.post(
  '/fines/:id/pay',
  authorize(...manageRoles),
  validate(libraryValidation.payFine),
  libraryController.payFine.bind(libraryController)
);

// ==================== Reports Routes ====================

router.get(
  '/reports',
  authorize(...manageRoles),
  libraryController.getLibraryReports.bind(libraryController)
);

export default router;
