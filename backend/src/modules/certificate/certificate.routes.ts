/**
 * Certificate Routes
 * 
 * API routes for certificate operations
 * 
 * Requirements: 25.1, 25.3, 25.4, 25.5
 */

import { Router } from 'express';
import { authenticate, authorize } from '@middleware/auth';
import { UserRole } from '@models/User.model';
import certificateController from './certificate.controller';
import {
  validate,
  validateQuery,
  validateParams,
  generateCertificateSchema,
  bulkGenerateCertificatesSchema,
  revokeCertificateSchema,
  certificateFiltersSchema,
  certificateNumberSchema,
} from './certificate.validation';

const router = Router();

const certificateManagers = [UserRole.SCHOOL_ADMIN, UserRole.ECA_COORDINATOR, UserRole.SPORTS_COORDINATOR];
// Public by design for QR-code certificate checks; keep this before authentication.
router.get(
  '/verify/:certificateNumber',
  validateParams(certificateNumberSchema),
  certificateController.verifyCertificate
);
router.use(authenticate);

/**
 * POST /api/v1/certificates/generate
 * Generate a certificate
 */
router.post(
  '/generate',
  authorize(...certificateManagers),
  validate(generateCertificateSchema),
  certificateController.generateCertificate
);

/**
 * POST /api/v1/certificates/bulk-generate
 * Generate multiple certificates in bulk
 */
router.post(
  '/bulk-generate',
  authorize(...certificateManagers),
  validate(bulkGenerateCertificatesSchema),
  certificateController.bulkGenerateCertificates
);

/**
 * GET /api/v1/certificates
 * Get all certificates with filters
 */
router.get(
  '/',
  authorize(...certificateManagers),
  validateQuery(certificateFiltersSchema),
  certificateController.getAllCertificates
);

/**
 * GET /api/v1/certificates/stats
 * Get certificate statistics
 */
router.get(
  '/stats',
  authorize(...certificateManagers),
  certificateController.getCertificateStats
);

/**
 * GET /api/v1/certificates/student/:studentId
 * Get certificates by student ID
 */
router.get(
  '/student/:studentId',
  authorize(UserRole.SCHOOL_ADMIN, UserRole.ECA_COORDINATOR, UserRole.SPORTS_COORDINATOR, UserRole.STUDENT, UserRole.PARENT),
  certificateController.getCertificatesByStudentId
);

/**
 * GET /api/v1/certificates/:id
 * Get certificate by ID
 */
router.get(
  '/:id',
  authorize(...certificateManagers),
  certificateController.getCertificateById
);

/**
 * PUT /api/v1/certificates/:id/revoke
 * Revoke certificate
 */
router.put(
  '/:id/revoke',
  authorize(...certificateManagers),
  validate(revokeCertificateSchema),
  certificateController.revokeCertificate
);

export default router;
