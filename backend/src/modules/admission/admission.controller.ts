import { Request, Response } from 'express';
import admissionService from './admission.service';
import { sendSuccess, calculatePagination } from '@utils/responseFormatter';
import { asyncHandler, NotFoundError, ValidationError } from '@middleware/errorHandler';
import { AdmissionStatus } from '@models/Admission.model';
import { HTTP_STATUS, PAGINATION } from '@config/constants';
import { logger } from '@utils/logger';

/**
 * Admission Controller
 * Handles HTTP requests for admission workflow endpoints
 * Requirements: 3.1-3.12
 */
class AdmissionController {
  /**
   * Create new inquiry
   * POST /api/v1/admissions/inquiry
   */
  createInquiry = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;

    const admission = await admissionService.createInquiry(req.body, userId);

    logger.info('Admission inquiry created via API', {
      admissionId: admission.admissionId,
      createdBy: userId
    });

    sendSuccess(res, admission, 'Inquiry created successfully', HTTP_STATUS.CREATED);
  });

  /**
   * Convert inquiry to application
   * POST /api/v1/admissions/:id/apply
   */
  convertToApplication = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const admissionId = Number(req.params.id);
    const userId = req.user?.userId;

    try {
      const admission = await admissionService.convertToApplication(admissionId, req.body, userId);
      sendSuccess(res, admission, 'Application submitted successfully');
    } catch (error) {
      if ((error as Error).message === 'Admission not found') {
        throw new NotFoundError('Admission');
      }
      throw error;
    }
  });

  /**
   * Schedule admission test
   * POST /api/v1/admissions/:id/schedule-test
   */
  scheduleTest = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const admissionId = Number(req.params.id);
    const userId = req.user?.userId;
    const { testDate } = req.body;

    try {
      const admission = await admissionService.scheduleTest(
        admissionId,
        new Date(testDate),
        userId
      );
      sendSuccess(res, admission, 'Admission test scheduled successfully');
    } catch (error) {
      if ((error as Error).message === 'Admission not found') {
        throw new NotFoundError('Admission');
      }
      throw error;
    }
  });

  /**
   * Record admission test score
   * POST /api/v1/admissions/:id/record-test-score
   */
  recordTestScore = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const admissionId = Number(req.params.id);
    const userId = req.user?.userId;

    try {
      const admission = await admissionService.recordTestScore(admissionId, req.body, userId);
      sendSuccess(res, admission, 'Test score recorded successfully');
    } catch (error) {
      if ((error as Error).message === 'Admission not found') {
        throw new NotFoundError('Admission');
      }
      throw error;
    }
  });

  /**
   * Schedule interview
   * POST /api/v1/admissions/:id/schedule-interview
   */
  scheduleInterview = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const admissionId = Number(req.params.id);
    const userId = req.user?.userId;
    const { interviewDate, interviewerName } = req.body;

    try {
      const admission = await admissionService.scheduleInterview(
        admissionId,
        new Date(interviewDate),
        interviewerName,
        userId
      );
      sendSuccess(res, admission, 'Interview scheduled successfully');
    } catch (error) {
      if ((error as Error).message === 'Admission not found') {
        throw new NotFoundError('Admission');
      }
      throw error;
    }
  });

  /**
   * Record interview feedback
   * POST /api/v1/admissions/:id/record-interview
   */
  recordInterview = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const admissionId = Number(req.params.id);
    const userId = req.user?.userId;

    try {
      const admission = await admissionService.recordInterview(admissionId, req.body, userId);
      sendSuccess(res, admission, 'Interview feedback recorded successfully');
    } catch (error) {
      if ((error as Error).message === 'Admission not found') {
        throw new NotFoundError('Admission');
      }
      throw error;
    }
  });

  /**
   * Admit applicant
   * POST /api/v1/admissions/:id/admit
   */
  admit = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const admissionId = Number(req.params.id);
    const userId = req.user?.userId;

    try {
      const admission = await admissionService.admit(admissionId, userId);
      sendSuccess(res, admission, 'Applicant admitted successfully');
    } catch (error) {
      if ((error as Error).message === 'Admission not found') {
        throw new NotFoundError('Admission');
      }
      throw error;
    }
  });

  /**
   * Enroll admitted applicant as student
   * POST /api/v1/admissions/:id/enroll
   */
  enroll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const admissionId = Number(req.params.id);
    const userId = req.user?.userId;

    try {
      const result = await admissionService.enroll(admissionId, req.body, userId);
      sendSuccess(res, {
        admission: result.admission,
        student: result.student,
        credentials: {
          student: {
            username: result.credentials.studentUsername,
            temporaryPassword: result.credentials.studentPassword,
          },
          parent: result.credentials.parentUsername ? {
            username: result.credentials.parentUsername,
            temporaryPassword: result.credentials.parentPassword,
          } : null,
          note: 'Credentials have been sent via SMS to the guardian. Student and parent must change password on first login.',
        },
      }, 'Applicant enrolled as student successfully', HTTP_STATUS.CREATED);
    } catch (error) {
      if ((error as Error).message === 'Admission not found') {
        throw new NotFoundError('Admission');
      }
      throw error;
    }
  });

  /**
   * Reject applicant
   * POST /api/v1/admissions/:id/reject
   */
  reject = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const admissionId = Number(req.params.id);
    const userId = req.user?.userId;
    const { reason } = req.body;

    if (!reason) {
      throw new ValidationError('Rejection reason is required');
    }

    try {
      const admission = await admissionService.reject(admissionId, reason, userId);
      sendSuccess(res, admission, 'Applicant rejected');
    } catch (error) {
      if ((error as Error).message === 'Admission not found') {
        throw new NotFoundError('Admission');
      }
      throw error;
    }
  });

  /**
   * Get admission by ID
   * GET /api/v1/admissions/:id
   */
  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const admissionId = Number(req.params.id);

    const admission = await admissionService.findById(admissionId);

    if (!admission) {
      throw new NotFoundError('Admission');
    }

    sendSuccess(res, admission, 'Admission retrieved successfully');
  });

  /**
   * List admissions with filters
   * GET /api/v1/admissions
   */
  getAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_PAGE_SIZE,
      status,
      applyingForClass,
      academicYearId,
      search
    } = req.query;

    const pageNum = Number(page);
    const limitNum = Math.min(Number(limit), PAGINATION.MAX_PAGE_SIZE);
    const offset = (pageNum - 1) * limitNum;

    const { admissions, total } = await admissionService.findAll(
      {
        status: status as AdmissionStatus,
        applyingForClass: applyingForClass ? Number(applyingForClass) : undefined,
        academicYearId: academicYearId ? Number(academicYearId) : undefined,
        search: search as string
      },
      { limit: limitNum, offset }
    );

    const meta = calculatePagination(total, pageNum, limitNum);

    sendSuccess(res, admissions, 'Admissions retrieved successfully', HTTP_STATUS.OK, meta);
  });

  /**
   * Get admission statistics
   * GET /api/v1/admissions/reports
   */
  getStatistics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const academicYearId = req.query.academicYearId
      ? Number(req.query.academicYearId)
      : undefined;

    const stats = await admissionService.getStatistics(academicYearId);

    sendSuccess(res, stats, 'Admission statistics retrieved successfully');
  });
}

export default new AdmissionController();
