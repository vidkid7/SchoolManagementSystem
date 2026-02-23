/**
 * Document Controller
 * 
 * HTTP request handlers for document management
 * 
 * Requirements: 27.1, 27.2, 27.3, 27.4, 27.5, 27.6, 27.7, 27.8
 */

import { Request, Response, NextFunction } from 'express';
import { DocumentService } from './document.service';
import {
  uploadDocumentSchema,
  updateDocumentSchema,
  documentFiltersSchema,
  documentParamsSchema,
  validate,
  validateQuery,
  validateParams,
} from './document.validation';
import { AuthenticationError, ValidationError } from '../../middleware/errorHandler';
import { logger } from '../../utils/logger';

export class DocumentController {
  private service: DocumentService;

  constructor(service?: DocumentService) {
    this.service = service || new DocumentService();
  }

  /**
   * Upload a new document
   * POST /api/v1/documents
   */
  uploadDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      // Validate request body
      const { error: bodyError, value: bodyValue } = validate(uploadDocumentSchema)(req.body);
      if (bodyError) {
        throw new ValidationError('Invalid request body');
      }

      // Validate file
      if (!req.file) {
        throw new ValidationError('No file uploaded');
      }

      // Validate file size
      const maxFileSize = 10 * 1024 * 1024; // 10MB
      if (req.file.size > maxFileSize) {
        throw new ValidationError(`File size exceeds maximum limit of ${maxFileSize / 1024 / 1024}MB`);
      }

      // Create document
      const document = await this.service.uploadDocument({
        name: bodyValue.name,
        originalName: req.file.originalname,
        description: bodyValue.description,
        category: bodyValue.category,
        mimeType: req.file.mimetype,
        size: req.file.size,
        buffer: req.file.buffer,
        uploadedBy: req.user.userId,
        accessLevel: bodyValue.accessLevel,
        allowedRoles: bodyValue.allowedRoles,
        allowedUserIds: bodyValue.allowedUserIds,
        tags: bodyValue.tags,
        metadata: bodyValue.metadata,
      });

      logger.info('Document uploaded', {
        documentId: document.documentId,
        documentNumber: document.documentNumber,
        userId: req.user.userId,
      });

      res.status(201).json({
        success: true,
        data: document,
        message: 'Document uploaded successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Upload a new version of a document
   * POST /api/v1/documents/:documentId/versions
   */
  uploadVersion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      // Validate params
      const { error: paramsError, value: paramsValue } = validateParams(documentParamsSchema)(req.params);
      if (paramsError) {
        throw new ValidationError('Invalid parameters');
      }

      // Validate request body
      const { error: bodyError, value: bodyValue } = validate(updateDocumentSchema)(req.body);
      if (bodyError) {
        throw new ValidationError('Invalid request body');
      }

      // Validate file
      if (!req.file) {
        throw new ValidationError('No file uploaded');
      }

      // Create new version
      const document = await this.service.uploadVersion(paramsValue.documentId, {
        name: bodyValue.name,
        originalName: req.file.originalname,
        description: bodyValue.description,
        mimeType: req.file.mimetype,
        size: req.file.size,
        buffer: req.file.buffer,
        tags: bodyValue.tags,
        metadata: bodyValue.metadata,
      });

      logger.info('Document version uploaded', {
        documentId: document.documentId,
        documentNumber: document.documentNumber,
        version: document.version,
        userId: req.user.userId,
      });

      res.status(201).json({
        success: true,
        data: document,
        message: `Document version ${document.version} uploaded successfully`,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get document by ID
   * GET /api/v1/documents/:documentId
   */
  getDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      // Validate params
      const { error: paramsError, value: paramsValue } = validateParams(documentParamsSchema)(req.params);
      if (paramsError) {
        throw new ValidationError('Invalid parameters');
      }

      const document = await this.service.getDocumentById(
        paramsValue.documentId,
        req.user.userId,
        [req.user.role]
      );

      res.json({
        success: true,
        data: document,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Preview document
   * GET /api/v1/documents/:documentId/preview
   */
  previewDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      // Validate params
      const { error: paramsError, value: paramsValue } = validateParams(documentParamsSchema)(req.params);
      if (paramsError) {
        throw new ValidationError('Invalid parameters');
      }

      const result = await this.service.previewDocument(
        paramsValue.documentId,
        req.user.userId,
        [req.user.role]
      );

      res.json({
        success: true,
        data: {
          document: result.document,
          previewUrl: result.previewUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Download document
   * GET /api/v1/documents/:documentId/download
   */
  downloadDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      // Validate params
      const { error: paramsError, value: paramsValue } = validateParams(documentParamsSchema)(req.params);
      if (paramsError) {
        throw new ValidationError('Invalid parameters');
      }

      const result = await this.service.downloadDocument(
        paramsValue.documentId,
        req.user.userId,
        [req.user.role]
      );

      // Set headers for download
      res.download(result.filePath, result.document.originalName);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Search documents
   * GET /api/v1/documents
   */
  searchDocuments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      // Validate query params
      const { error: queryError, value: queryValue } = validateQuery(documentFiltersSchema)(req.query);
      if (queryError) {
        throw new ValidationError('Invalid query parameters');
      }

      const page = queryValue.page || 1;
      const limit = queryValue.limit || 20;

      const result = await this.service.searchDocuments(
        {
          category: queryValue.category,
          status: queryValue.status,
          accessLevel: queryValue.accessLevel,
          uploadedBy: queryValue.uploadedBy,
          search: queryValue.search,
          tags: queryValue.tags,
          startDate: queryValue.startDate,
          endDate: queryValue.endDate,
        },
        req.user.userId,
        [req.user.role],
        page,
        limit
      );

      res.json({
        success: true,
        data: result.documents,
        meta: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get documents by category
   * GET /api/v1/documents/category/:category
   */
  getDocumentsByCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      const { category } = req.params;

      const documents = await this.service.getDocumentsByCategory(
        category,
        req.user.userId,
        [req.user.role]
      );

      res.json({
        success: true,
        data: documents,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get document versions
   * GET /api/v1/documents/:documentId/versions
   */
  getDocumentVersions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      // Validate params
      const { error: paramsError, value: paramsValue } = validateParams(documentParamsSchema)(req.params);
      if (paramsError) {
        throw new ValidationError('Invalid parameters');
      }

      const versions = await this.service.getDocumentVersions(paramsValue.documentId);

      res.json({
        success: true,
        data: versions,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update document
   * PUT /api/v1/documents/:documentId
   */
  updateDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      // Validate params
      const { error: paramsError, value: paramsValue } = validateParams(documentParamsSchema)(req.params);
      if (paramsError) {
        throw new ValidationError('Invalid parameters');
      }

      // Validate request body
      const { error: bodyError, value: bodyValue } = validate(updateDocumentSchema)(req.body);
      if (bodyError) {
        throw new ValidationError('Invalid request body');
      }

      const document = await this.service.updateDocument(
        paramsValue.documentId,
        bodyValue,
        req.user.userId
      );

      logger.info('Document updated', {
        documentId: document.documentId,
        userId: req.user.userId,
      });

      res.json({
        success: true,
        data: document,
        message: 'Document updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete document
   * DELETE /api/v1/documents/:documentId
   */
  deleteDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      // Validate params
      const { error: paramsError, value: paramsValue } = validateParams(documentParamsSchema)(req.params);
      if (paramsError) {
        throw new ValidationError('Invalid parameters');
      }

      const document = await this.service.deleteDocument(
        paramsValue.documentId,
        req.user.userId
      );

      logger.info('Document deleted', {
        documentId: document.documentId,
        userId: req.user.userId,
      });

      res.json({
        success: true,
        data: document,
        message: 'Document deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Archive document
   * POST /api/v1/documents/:documentId/archive
   */
  archiveDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      // Validate params
      const { error: paramsError, value: paramsValue } = validateParams(documentParamsSchema)(req.params);
      if (paramsError) {
        throw new ValidationError('Invalid parameters');
      }

      const document = await this.service.archiveDocument(
        paramsValue.documentId,
        req.user.userId
      );

      logger.info('Document archived', {
        documentId: document.documentId,
        userId: req.user.userId,
      });

      res.json({
        success: true,
        data: document,
        message: 'Document archived successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get document access logs
   * GET /api/v1/documents/:documentId/access-logs
   */
  getAccessLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      // Validate params
      const { error: paramsError, value: paramsValue } = validateParams(documentParamsSchema)(req.params);
      if (paramsError) {
        throw new ValidationError('Invalid parameters');
      }

      const logs = await this.service.getAccessLogs(
        paramsValue.documentId,
        req.user.userId,
        [req.user.role]
      );

      res.json({
        success: true,
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get document statistics
   * GET /api/v1/documents/statistics
   */
  getStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      const statistics = await this.service.getStatistics();

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new DocumentController();