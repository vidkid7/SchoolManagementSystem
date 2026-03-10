import { Router } from 'express';
import { authenticate, authorize } from '@middleware/auth';
import * as parentController from './parent.controller';
import { UserRole } from '@models/User.model';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.PARENT));

router.get('/dashboard', parentController.getDashboard);

router.get('/children', parentController.getChildren);

router.get('/children/:childId/summary', parentController.getChildSummary);

router.get('/children/:childId/attendance', parentController.getChildAttendance);

router.get('/children/:childId/grades', parentController.getChildGrades);

router.get('/children/:childId/fees', parentController.getChildFees);

router.get('/notifications', parentController.getNotifications);

// Library - child's borrowed books
router.get('/children/:childId/library', parentController.getChildLibrary);

// Assignments - child's assignments
router.get('/children/:childId/assignments', parentController.getChildAssignments);

// ECA & Sports - child's activities
router.get('/children/:childId/activities', parentController.getChildActivities);

// Behavior - child's behavior records
router.get('/children/:childId/behavior', parentController.getChildBehavior);

// Calendar - school events
router.get('/calendar', parentController.getSchoolCalendar);

// Certificates - child's certificates
router.get('/children/:childId/certificates', parentController.getChildCertificates);

export default router;
