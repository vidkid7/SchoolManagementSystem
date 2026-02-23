import { Router } from 'express';
import CVController from './cv.controller';
import { authenticate } from '@middleware/auth';

const router = Router();

/**
 * CV Routes
 * All routes require authentication
 * Note: More specific routes must come before generic /:id route
 */

// Get CV data (must come before /:id)
router.get('/:id/data', authenticate, CVController.getCVData);

// Check regeneration need (must come before /:id)
router.get('/:id/needs-regeneration', authenticate, CVController.checkNeedsRegeneration);

// Download PDF (must come before /:id)
router.get('/:id/download', authenticate, CVController.downloadPDF);

// Regenerate PDF
router.post('/:id/regenerate', authenticate, CVController.regeneratePDF);

// Get/Update customization (generic /:id route comes last)
router.get('/:id', authenticate, CVController.getCustomization);
router.put('/:id', authenticate, CVController.updateCustomization);

export default router;
