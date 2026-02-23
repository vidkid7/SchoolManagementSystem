/**
 * Certificate Controller
 * 
 * HTTP request handlers for certificate operations
 * 
 * Requirements: 25.1, 25.3, 25.4, 25.5
 */

import { Request, Response } from 'express';
import { CertificateService } from './certificate.service';
import { CertificateRepository } from './certificate.repository';
import { CertificateTemplateRepository } from './certificateTemplate.repository';

export class CertificateController {
  private service: CertificateService;

  constructor(service?: CertificateService) {
    this.service = service || new CertificateService(
      new CertificateRepository(),
      new CertificateTemplateRepository()
    );
  }

  /**
   * Generate a certificate
   * POST /api/v1/certificates/generate
   */
generateCertificate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { templateId, studentId, data, issuedDate, issuedDateBS } = req.body;
      const issuedBy = (req as any).user?.userId || 1; // Get from auth middleware

      const certificate = await this.service.generateCertificate({
        templateId,
        studentId,
        data,
        issuedBy,
        issuedDate: issuedDate ? new Date(issuedDate) : undefined,
        issuedDateBS,
      });

      res.status(201).json({
        success: true,
        data: certificate.toJSON(),
        message: 'Certificate generated successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'CERTIFICATE_GENERATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to generate certificate',
        },
      });
    }
  };

  /**
   * Generate multiple certificates in bulk
   * POST /api/v1/certificates/bulk-generate
   */
  bulkGenerateCertificates = async (req: Request, res: Response): Promise<void> => {
    try {
      const { templateId, students, issuedDate, issuedDateBS } = req.body;
      const issuedBy = (req as any).user?.userId || 1;

      const result = await this.service.bulkGenerateCertificates({
        templateId,
        students,
        issuedBy,
        issuedDate: issuedDate ? new Date(issuedDate) : undefined,
        issuedDateBS,
      });

      res.status(201).json({
        success: true,
        data: result,
        message: `Generated ${result.success.length} certificates successfully. ${result.failed.length} failed.`,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'BULK_GENERATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to generate certificates',
        },
      });
    }
  };

  /**
   * Get certificate by ID
   * GET /api/v1/certificates/:id
   */
getCertificateById = async (req: Request, res: Response): Promise<void> => {
    try {
      const certificateId = parseInt(req.params.id);
      const certificate = await this.service.getCertificateById(certificateId);

      res.status(200).json({
        success: true,
        data: certificate.toJSON(),
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: {
          code: 'CERTIFICATE_NOT_FOUND',
          message: error instanceof Error ? error.message : 'Certificate not found',
        },
      });
    }
  };

  /**
   * Get all certificates with filters
   * GET /api/v1/certificates
   */
  getAllCertificates = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters = {
        studentId: req.query.studentId ? parseInt(req.query.studentId as string) : undefined,
        type: req.query.type as string,
        status: req.query.status as 'active' | 'revoked',
        issuedDateFrom: req.query.issuedDateFrom ? new Date(req.query.issuedDateFrom as string) : undefined,
        issuedDateTo: req.query.issuedDateTo ? new Date(req.query.issuedDateTo as string) : undefined,
        search: req.query.search as string,
      };

const certificates = await this.service.getAllCertificates(filters);

      res.status(200).json({
        success: true,
        data: certificates.map(c => c.toJSON()),
        meta: {
          total: certificates.length,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to fetch certificates',
        },
      });
    }
  };

  /**
   * Get certificates by student ID
   * GET /api/v1/certificates/student/:studentId
   */
getCertificatesByStudentId = async (req: Request, res: Response): Promise<void> => {
    try {
      const studentId = parseInt(req.params.studentId);
      const certificates = await this.service.getCertificatesByStudentId(studentId);

      res.status(200).json({
        success: true,
        data: certificates.map(c => c.toJSON()),
        meta: {
          total: certificates.length,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to fetch certificates',
        },
      });
    }
  };

  /**
   * Verify certificate - Public endpoint
   * GET /api/v1/certificates/verify/:certificateNumber
   * 
   * Supports:
   * - QR code scanning (QR contains verification URL with certificate number)
   * - Direct certificate number lookup
   * 
   * Requirements: 25.7
   */
  verifyCertificate = async (req: Request, res: Response): Promise<void> => {
    try {
      const certificateNumber = req.params.certificateNumber;

      // Validate certificate number format
      if (!certificateNumber || certificateNumber.trim() === '') {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CERTIFICATE_NUMBER',
            message: 'Certificate number is required',
          },
        });
        return;
      }

      const result = await this.service.verifyCertificate(certificateNumber);

      // Return appropriate status code based on verification result
      const statusCode = result.valid ? 200 : 404;

      res.status(statusCode).json({
        success: result.valid,
        data: {
          valid: result.valid,
          certificate: result.certificate,
          message: result.message,
          verifiedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'VERIFICATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to verify certificate',
        },
      });
    }
  };

  /**
   * Revoke certificate
   * PUT /api/v1/certificates/:id/revoke
   */
revokeCertificate = async (req: Request, res: Response): Promise<void> => {
    try {
      const certificateId = parseInt(req.params.id);
      const { reason } = req.body;
      const revokedBy = (req as any).user?.userId || 1;

      const certificate = await this.service.revokeCertificate(certificateId, revokedBy, reason);

      res.status(200).json({
        success: true,
        data: certificate.toJSON(),
        message: 'Certificate revoked successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'REVOKE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to revoke certificate',
        },
      });
    }
  };

  /**
   * Get certificate statistics
   * GET /api/v1/certificates/stats
   */
  getCertificateStats = async (_req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.service.getCertificateStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'STATS_FAILED',
          message: error instanceof Error ? error.message : 'Failed to fetch statistics',
        },
      });
    }
  };
}

export default new CertificateController();
