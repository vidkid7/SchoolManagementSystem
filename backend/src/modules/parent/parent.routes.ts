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

export default router;
