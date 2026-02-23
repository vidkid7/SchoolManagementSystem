import { Router } from 'express';
import academicController from './academic.controller';
import { authenticate, authorize } from '@middleware/auth';
import { UserRole } from '@models/User.model';
import { validateRequest } from '@middleware/validation';
import {
  createAcademicYearValidation,
  updateAcademicYearValidation,
  getTermsValidation,
  createTermValidation,
  updateTermValidation,
  getClassesValidation,
  createClassValidation,
  updateClassValidation,
  getSubjectsValidation,
  createSubjectValidation,
  updateSubjectValidation,
  getTimetableValidation,
  getTimetableByClassValidation,
  createTimetableValidation,
  updateTimetableValidation,
  getSyllabusValidation,
  getSyllabusBySubjectValidation,
  createSyllabusValidation,
  updateSyllabusValidation
} from './academic.validation';

const router = Router();

const readRoles = [
  UserRole.SCHOOL_ADMIN,
  UserRole.CLASS_TEACHER,
  UserRole.SUBJECT_TEACHER,
  UserRole.DEPARTMENT_HEAD
];

const manageRoles = [UserRole.SCHOOL_ADMIN];

// Academic Years
router.get('/years', authenticate, authorize(...readRoles), academicController.getAcademicYears);
router.post('/years', authenticate, authorize(...manageRoles), validateRequest(createAcademicYearValidation), academicController.createAcademicYear);
router.put('/years', authenticate, authorize(...manageRoles), validateRequest(updateAcademicYearValidation), academicController.updateAcademicYear);

// Terms
router.get('/terms', authenticate, authorize(...readRoles), validateRequest(getTermsValidation), academicController.getTerms);
router.post('/terms', authenticate, authorize(...manageRoles), validateRequest(createTermValidation), academicController.createTerm);
router.put('/terms', authenticate, authorize(...manageRoles), validateRequest(updateTermValidation), academicController.updateTerm);

// Classes
router.get('/classes', authenticate, authorize(...readRoles), validateRequest(getClassesValidation), academicController.getClasses);
router.post('/classes', authenticate, authorize(...manageRoles), validateRequest(createClassValidation), academicController.createClass);
router.put('/classes', authenticate, authorize(...manageRoles), validateRequest(updateClassValidation), academicController.updateClass);
router.delete('/classes/:classId', authenticate, authorize(...manageRoles), academicController.deleteClass);

// Class-Subject Assignment
router.get('/classes/:classId/subjects', authenticate, authorize(...readRoles), academicController.getClassSubjects);
router.post('/classes/:classId/subjects', authenticate, authorize(...manageRoles), academicController.assignSubjectToClass);
router.delete('/classes/:classId/subjects/:subjectId', authenticate, authorize(...manageRoles), academicController.removeSubjectFromClass);

// Subjects
router.get('/subjects', authenticate, authorize(...readRoles), validateRequest(getSubjectsValidation), academicController.getSubjects);
router.post('/subjects', authenticate, authorize(...manageRoles), validateRequest(createSubjectValidation), academicController.createSubject);
router.put('/subjects', authenticate, authorize(...manageRoles), validateRequest(updateSubjectValidation), academicController.updateSubject);
router.delete('/subjects/:subjectId', authenticate, authorize(...manageRoles), academicController.deleteSubject);

// Timetable
router.get('/timetable', authenticate, authorize(...readRoles), validateRequest(getTimetableValidation), academicController.getTimetable);
router.get('/timetable/:classId', authenticate, authorize(...readRoles), validateRequest(getTimetableByClassValidation), academicController.getTimetableByClass);
router.post('/timetable', authenticate, authorize(...manageRoles), validateRequest(createTimetableValidation), academicController.createTimetable);
router.put('/timetable', authenticate, authorize(...manageRoles), validateRequest(updateTimetableValidation), academicController.updateTimetable);

// Syllabus
router.get('/syllabus', authenticate, authorize(...readRoles), validateRequest(getSyllabusValidation), academicController.getSyllabus);
router.get('/syllabus/:subjectId', authenticate, authorize(...readRoles), validateRequest(getSyllabusBySubjectValidation), academicController.getSyllabusBySubject);
router.post('/syllabus', authenticate, authorize(...manageRoles), validateRequest(createSyllabusValidation), academicController.createSyllabus);
router.put('/syllabus', authenticate, authorize(...manageRoles), validateRequest(updateSyllabusValidation), academicController.updateSyllabus);

export default router;
