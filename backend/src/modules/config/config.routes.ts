import { Router } from 'express';
import configController from './config.controller';
import { authenticate } from '@middleware/auth';

const router = Router();

router.get(
  '/attendance-rules/active',
  authenticate,
  configController.getActiveAttendanceRules
);

router.put(
  '/attendance-rules/:id',
  authenticate,
  configController.updateAttendanceRules
);

router.post(
  '/attendance-rules',
  authenticate,
  configController.createAttendanceRules
);

export default router;
