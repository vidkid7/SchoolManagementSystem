import { Router } from 'express';
import reportController from './report.controller';
import { authenticate, authorize } from '@middleware/auth';
import { UserRole } from '@models/User.model';

const router = Router();

router.use(authenticate);

router.get('/dashboard', authorize(
  UserRole.SCHOOL_ADMIN,
  UserRole.DEPARTMENT_HEAD,
  UserRole.CLASS_TEACHER,
  UserRole.SUBJECT_TEACHER,
  UserRole.ACCOUNTANT,
  UserRole.LIBRARIAN,
  UserRole.ECA_COORDINATOR,
  UserRole.SPORTS_COORDINATOR
), reportController.getDashboard);

router.get('/enrollment', authorize(
  UserRole.SCHOOL_ADMIN,
  UserRole.CLASS_TEACHER,
  UserRole.DEPARTMENT_HEAD
), reportController.getEnrollmentReport);

router.get('/attendance', authorize(
  UserRole.SCHOOL_ADMIN,
  UserRole.CLASS_TEACHER,
  UserRole.SUBJECT_TEACHER,
  UserRole.DEPARTMENT_HEAD
), reportController.getAttendanceReport);

router.get('/fee-collection', authorize(
  UserRole.SCHOOL_ADMIN,
  UserRole.ACCOUNTANT
), reportController.getFeeCollectionReport);

router.get('/examination', authorize(
  UserRole.SCHOOL_ADMIN,
  UserRole.CLASS_TEACHER,
  UserRole.SUBJECT_TEACHER,
  UserRole.DEPARTMENT_HEAD
), reportController.getExaminationReport);

router.get('/teacher-performance', authorize(
  UserRole.SCHOOL_ADMIN,
  UserRole.DEPARTMENT_HEAD
), reportController.getTeacherPerformanceReport);

router.get('/library', authorize(
  UserRole.SCHOOL_ADMIN,
  UserRole.LIBRARIAN
), reportController.getLibraryReport);

router.get('/eca', authorize(
  UserRole.SCHOOL_ADMIN,
  UserRole.ECA_COORDINATOR,
  UserRole.DEPARTMENT_HEAD
), reportController.getECAReport);

router.get('/sports', authorize(
  UserRole.SCHOOL_ADMIN,
  UserRole.SPORTS_COORDINATOR,
  UserRole.DEPARTMENT_HEAD
), reportController.getSportsReport);

router.get('/export/excel/:reportType', authorize(
  UserRole.SCHOOL_ADMIN,
  UserRole.DEPARTMENT_HEAD,
  UserRole.ACCOUNTANT
), reportController.exportReportToExcel);

router.get('/export/pdf/:reportType', authorize(
  UserRole.SCHOOL_ADMIN,
  UserRole.DEPARTMENT_HEAD,
  UserRole.ACCOUNTANT
), reportController.exportReportToPDF);

export default router;
