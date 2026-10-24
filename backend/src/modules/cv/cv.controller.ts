import { Request, Response } from 'express';
import CVService from './cv.service';
import { sendSuccess } from '@utils/responseFormatter';
import { asyncHandler } from '@middleware/errorHandler';
import { NotFoundError } from '@middleware/errorHandler';
import { logger } from '@utils/logger';

/**
 * CV Controller
 * Handles HTTP requests for CV generation endpoints
 */
class CVController {
  /**
   * Get CV data for a student
   * GET /api/v1/cv/:id/data
   */
  getCVData = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const studentId = Number(req.params.id);

    const cvData = await CVService.getCVData(studentId);

    if (!cvData) {
      throw new NotFoundError('Student');
    }

    logger.info('CV data retrieved', { studentId });

    sendSuccess(res, cvData, 'CV data retrieved successfully');
  });

  /**
   * Get CV customization settings
   * GET /api/v1/cv/:id
   */
  getCustomization = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const customization = await CVService.getOrCreateCustomization(Number(req.params.id));
    sendSuccess(res, customization, 'Customization retrieved successfully');
  });

  /**
   * Update CV customization settings
   * PUT /api/v1/cv/:id
   */
  updateCustomization = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const customization = await CVService.updateCustomization(Number(req.params.id), req.body);
    logger.info('CV customization updated', { studentId: customization.studentId });
    sendSuccess(res, customization, 'Customization updated successfully');
  });

  /**
   * Check if CV needs regeneration
   * GET /api/v1/cv/:id/needs-regeneration
   */
  checkNeedsRegeneration = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const studentId = Number(req.params.id);

    const needsRegeneration = await CVService.needsRegeneration(studentId);

    sendSuccess(res, { needsRegeneration }, 'Regeneration check completed');
  });

  /**
   * Generate and download CV PDF
   * GET /api/v1/cv/:id/download
   */
  downloadPDF = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const studentId = Number(req.params.id);
    const customization = {
      templateId: req.query.template as string,
      schoolBrandingEnabled: req.query.branding === 'true',
      includePersonalInfo: req.query.personalInfo !== 'false',
      includePhoto: req.query.photo !== 'false',
      includeAttendance: req.query.attendance !== 'false',
      includeGrades: req.query.grades !== 'false',
      includeECA: req.query.eca !== 'false',
      includeSports: req.query.sports !== 'false',
      includeCertificates: req.query.certificates !== 'false'
    };

    const pdfBuffer = await CVService.generatePDF(studentId, customization);

    logger.info('CV PDF generated', { studentId });

    // Set CORS headers explicitly for binary response
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=CV_${studentId}_${new Date().toISOString().split('T')[0]}.pdf`);
    res.send(pdfBuffer);
  });

  /**
   * Regenerate CV PDF
   * POST /api/v1/cv/:id/regenerate
   */
  regeneratePDF = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const studentId = Number(req.params.id);
    const customization = {
      templateId: req.query.template as string,
      schoolBrandingEnabled: req.query.branding === 'true',
      includePersonalInfo: req.query.personalInfo !== 'false',
      includeAttendance: req.query.attendance !== 'false',
      includeGrades: req.query.grades !== 'false',
      includeECA: req.query.eca !== 'false',
      includeSports: req.query.sports !== 'false',
      includeCertificates: req.query.certificates !== 'false'
    };

    const pdfBuffer = await CVService.generatePDF(studentId, customization);
    await CVService.markGenerated(studentId);

    logger.info('CV PDF regenerated', { studentId });

    // Set CORS headers explicitly for binary response
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=CV_${studentId}_${new Date().toISOString().split('T')[0]}.pdf`);
    res.send(pdfBuffer);
  });
}

export default new CVController();
