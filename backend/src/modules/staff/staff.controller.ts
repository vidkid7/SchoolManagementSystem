import { Request, Response } from 'express';
import staffService from './staff.service';
import staffDocumentService from './staffDocument.service';
import { sendSuccess, calculatePagination } from '@utils/responseFormatter';
import { asyncHandler, NotFoundError, ValidationError } from '@middleware/errorHandler';
import { StaffCategory, StaffStatus } from '@models/Staff.model';
import { StaffDocumentCategory } from '@models/StaffDocument.model';
import { HTTP_STATUS, PAGINATION } from '@config/constants';

/**
 * Staff Controller
 */
class StaffController {
  /**
   * Get all staff
   */
  getAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_PAGE_SIZE,
      category,
      status,
      department,
      search
    } = req.query;

    const pageNum = Number(page);
    const limitNum = Math.min(Number(limit), PAGINATION.MAX_PAGE_SIZE);
    const offset = (pageNum - 1) * limitNum;

    const { staff, total } = await staffService.findAll(
      {
        category: category as StaffCategory,
        status: status as StaffStatus,
        department: department as string,
        search: search as string
      },
      { limit: limitNum, offset }
    );

    const meta = calculatePagination(total, pageNum, limitNum);

    sendSuccess(res, staff, 'Staff retrieved successfully', HTTP_STATUS.OK, meta);
  });

  /**
   * Get staff by ID
   */
  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const staffId = Number(req.params.id);

    const staff = await staffService.findById(staffId);

    if (!staff) {
      throw new NotFoundError('Staff');
    }

    sendSuccess(res, staff, 'Staff retrieved successfully');
  });

  /**
   * Create staff
   */
  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const staff = await staffService.create(req.body);

    sendSuccess(res, staff, 'Staff created successfully', HTTP_STATUS.CREATED);
  });

  /**
   * Update staff
   */
  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const staffId = Number(req.params.id);

    const staff = await staffService.update(staffId, req.body);

    if (!staff) {
      throw new NotFoundError('Staff');
    }

    sendSuccess(res, staff, 'Staff updated successfully');
  });

  /**
   * Delete staff
   */
  delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const staffId = Number(req.params.id);

    const deleted = await staffService.delete(staffId);

    if (!deleted) {
      throw new NotFoundError('Staff');
    }

    sendSuccess(res, null, 'Staff deleted successfully');
  });

  /**
   * Assign staff to class/subject
   */
  assign = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const assignment = await staffService.assign(req.body, { skipValidation: true });

    sendSuccess(res, assignment, 'Staff assigned successfully', HTTP_STATUS.CREATED);
  });

  /**
   * Get staff assignments
   */
  getAssignments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const staffId = Number(req.params.id);
    const academicYearId = req.query.academicYearId
      ? Number(req.query.academicYearId)
      : undefined;
    const includeInactive = req.query.includeInactive === 'true';

    const assignments = await staffService.getAssignments(staffId, {
      academicYearId,
      includeInactive
    });

    sendSuccess(res, assignments, 'Assignments retrieved successfully');
  });

  /**
   * End staff assignment
   */
  endAssignment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const assignmentId = Number(req.params.assignmentId);

    const success = await staffService.endAssignment(assignmentId);

    if (!success) {
      throw new NotFoundError('Assignment');
    }

    sendSuccess(res, null, 'Assignment ended successfully');
  });

  /**
   * Delete staff assignment
   */
  deleteAssignment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const assignmentId = Number(req.params.assignmentId);

    const success = await staffService.deleteAssignment(assignmentId);

    if (!success) {
      throw new NotFoundError('Assignment');
    }

    sendSuccess(res, null, 'Assignment deleted successfully');
  });

  /**
   * Upload staff photo
   */
  uploadPhoto = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const staffId = Number(req.params.id);
    
    if (!req.file) {
      throw new Error('No photo file provided');
    }

    // For now, just save the file path
    // In production, you'd want to:
    // 1. Compress the image
    // 2. Save to proper location
    // 3. Generate thumbnail
    // 4. Update staff record with photoUrl
    
    const photoUrl = `/uploads/staff/${staffId}/${req.file.filename}`;
    
    const staff = await staffService.update(staffId, { photoUrl });

    if (!staff) {
      throw new NotFoundError('Staff');
    }

    sendSuccess(res, { photoUrl }, 'Photo uploaded successfully');
  });

  /**
   * Get class teacher
   */
  getClassTeacher = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const classId = Number(req.params.classId);
    const academicYearId = req.query.academicYearId
      ? Number(req.query.academicYearId)
      : undefined;

    if (!academicYearId) {
      throw new Error('Academic year ID is required');
    }

    const teacher = await staffService.getClassTeacher(classId, academicYearId);

    sendSuccess(res, teacher, 'Class teacher retrieved successfully');
  });

  /**
   * Get subject teachers
   */
  getSubjectTeachers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const classId = Number(req.params.classId);
    const subjectId = Number(req.params.subjectId);
    const academicYearId = req.query.academicYearId
      ? Number(req.query.academicYearId)
      : undefined;

    // Validate parameters
    if (!classId || isNaN(classId)) {
      throw new ValidationError('Valid class ID is required');
    }

    if (!subjectId || isNaN(subjectId)) {
      throw new ValidationError('Valid subject ID is required');
    }

    if (!academicYearId) {
      throw new ValidationError('Academic year ID is required');
    }

    const teachers = await staffService.getSubjectTeachers(classId, subjectId, academicYearId);

    sendSuccess(res, teachers, 'Subject teachers retrieved successfully');
  });

  /**
   * Get staff statistics
   */
  getStatistics = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const stats = await staffService.getStatistics();

    sendSuccess(res, stats, 'Staff statistics retrieved successfully');
  });

  /**
   * Upload staff document
   */
  uploadDocument = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const staffId = Number(req.params.id);
    const { category, documentName, description, expiryDate } = req.body;
    const uploadedBy = (req as any).user?.userId;

    if (!req.file) {
      throw new Error('No file uploaded');
    }

    const document = await staffDocumentService.uploadDocument(
      req.file,
      staffId,
      category as StaffDocumentCategory,
      documentName,
      uploadedBy,
      description,
      expiryDate ? new Date(expiryDate) : undefined
    );

    sendSuccess(res, document, 'Document uploaded successfully', HTTP_STATUS.CREATED);
  });

  /**
   * Get staff documents
   */
  getDocuments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const staffId = Number(req.params.id);
    const { category, latestOnly, includeExpired } = req.query;

    const documents = await staffDocumentService.getDocuments(staffId, {
      category: category as StaffDocumentCategory,
      latestOnly: latestOnly === 'true',
      includeExpired: includeExpired === 'true'
    });

    sendSuccess(res, documents, 'Documents retrieved successfully');
  });

  /**
   * Get document by ID
   */
  getDocumentById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const documentId = Number(req.params.documentId);

    const document = await staffDocumentService.getDocumentById(documentId);

    if (!document) {
      throw new NotFoundError('Document');
    }

    sendSuccess(res, document, 'Document retrieved successfully');
  });

  /**
   * Get document versions
   */
  getDocumentVersions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const staffId = Number(req.params.id);
    const { category, documentName } = req.query;

    if (!category || !documentName) {
      throw new Error('Category and documentName are required');
    }

    const versions = await staffDocumentService.getDocumentVersions(
      staffId,
      category as StaffDocumentCategory,
      documentName as string
    );

    sendSuccess(res, versions, 'Document versions retrieved successfully');
  });

  /**
   * Update document metadata
   */
  updateDocument = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const documentId = Number(req.params.documentId);
    const { documentName, description, expiryDate } = req.body;

    const document = await staffDocumentService.updateDocument(documentId, {
      documentName,
      description,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined
    });

    if (!document) {
      throw new NotFoundError('Document');
    }

    sendSuccess(res, document, 'Document updated successfully');
  });

  /**
   * Delete document
   */
  deleteDocument = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const documentId = Number(req.params.documentId);

    const deleted = await staffDocumentService.deleteDocument(documentId);

    if (!deleted) {
      throw new NotFoundError('Document');
    }

    sendSuccess(res, null, 'Document deleted successfully');
  });

  /**
   * Get document statistics
   */
  getDocumentStatistics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const staffId = Number(req.params.id);

    const stats = await staffDocumentService.getDocumentStatistics(staffId);

    sendSuccess(res, stats, 'Document statistics retrieved successfully');
  });

  /**
   * Get expired documents
   */
  getExpiredDocuments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const staffId = req.params.id ? Number(req.params.id) : undefined;

    const documents = await staffDocumentService.getExpiredDocuments(staffId);

    sendSuccess(res, documents, 'Expired documents retrieved successfully');
  });

  /**
   * Get documents expiring soon
   */
  getDocumentsExpiringSoon = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const staffId = req.params.id ? Number(req.params.id) : undefined;
    const days = req.query.days ? Number(req.query.days) : 30;

    const documents = await staffDocumentService.getDocumentsExpiringSoon(days, staffId);

    sendSuccess(res, documents, 'Documents expiring soon retrieved successfully');
  });

  /**
   * Bulk upload documents
   */
  bulkUploadDocuments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const staffId = Number(req.params.id);
    const { category } = req.body;
    const uploadedBy = (req as any).user?.userId;

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      throw new Error('No files uploaded');
    }

    const documents = await staffDocumentService.bulkUploadDocuments(
      req.files,
      staffId,
      category as StaffDocumentCategory,
      uploadedBy
    );

    sendSuccess(res, documents, 'Documents uploaded successfully', HTTP_STATUS.CREATED);
  });
}

export default new StaffController();
