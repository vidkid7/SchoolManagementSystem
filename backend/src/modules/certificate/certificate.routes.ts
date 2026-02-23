/**
 * Certificate Routes
 * 
 * API routes for certificate operations
 * 
 * Requirements: 25.1, 25.3, 25.4, 25.5
 */

import { Router } from 'express';
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

/**
 * POST /api/v1/certificates/generate
 * Generate a certificate
 */
router.post(
  '/generate',
  validate(generateCertificateSchema),
  certificateController.generateCertificate
);

/**
 * POST /api/v1/certificates/bulk-generate
 * Generate multiple certificates in bulk
 */
router.post(
  '/bulk-generate',
  validate(bulkGenerateCertificatesSchema),
  certificateController.bulkGenerateCertificates
);

/**
 * GET /api/v1/certificates
 * Get all certificates with filters
 */
router.get(
  '/',
  validateQuery(certificateFiltersSchema),
  certificateController.getAllCertificates
);

/**
 * GET /api/v1/certificates/stats
 * Get certificate statistics
 */
router.get(
  '/stats',
  certificateController.getCertificateStats
);

/**
 * GET /api/v1/certificates/verify/:certificateNumber
 * Verify certificate by certificate number
 * Public endpoint - supports QR code scanning and direct lookup
 * Requirements: 25.7
 */
router.get(
  '/verify/:certificateNumber',
  validateParams(certificateNumberSchema),
  certificateController.verifyCertificate
);

/**
 * GET /api/v1/certificates/student/:studentId
 * Get certificates by student ID
 */
router.get(
  '/student/:studentId',
  certificateController.getCertificatesByStudentId
);

/**
 * GET /api/v1/certificates/:id
 * Get certificate by ID
 */
router.get(
  '/:id',
  certificateController.getCertificateById
);

/**
 * PUT /api/v1/certificates/:id/revoke
 * Revoke certificate
 */
router.put(
  '/:id/revoke',
  validate(revokeCertificateSchema),
  certificateController.revokeCertificate
);

export default router;
