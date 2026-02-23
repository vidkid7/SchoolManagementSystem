/**
 * Document Controller Unit Tests
 * 
 * Tests for document HTTP endpoints
 * 
 * Requirements: 27.1, 27.2, 27.3, 27.4, 27.5, 27.6, 27.7, 27.8
 */

import { Request, Response } from 'express';
import { DocumentController } from '../document.controller';
import { DocumentService } from '../document.service';
import { Document } from '../../../models/Document.model';
import { AuthenticationError, ValidationError } from '../../../middleware/errorHandler';
import { UserRole } from '../../../models/User.model';

// Mock the service
jest.mock('../document.service');

describe('DocumentController', () => {
  let controller: DocumentController;
  let mockService: jest.Mocked<DocumentService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockService = new DocumentService() as jest.Mocked<DocumentService>;
    controller = new DocumentController(mockService);
    
    mockRequest = {
      user: { userId: 1, username: 'test', email: 'test@test.com', role: UserRole.SCHOOL_ADMIN },
      body: {},
      query: {},
      params: {},
      file: {
        fieldname: 'file',
        originalname: 'test.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('test'),
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      },
    };

    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      download: jest.fn(),
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadDocument', () => {
    it('should upload document successfully', async () => {
      // Arrange
      const mockDocument: Partial<Document> = {
        documentId: 1,
        documentNumber: 'DOC-2024-000001',
        name: 'Test Document',
        originalName: 'test.pdf',
        category: 'academic',
        mimeType: 'application/pdf',
        size: 1024,
        storagePath: '/uploads/documents/test.pdf',
        version: 1,
        uploadedBy: 1,
        accessLevel: 'private',
        isCompressed: false,
        status: 'active',
        isImage: () => false,
        isViewable: () => true,
        getActualSize: () => 1024,
        toJSON: function() { return this; },
      } as unknown as Document;

      mockService.uploadDocument = jest.fn().mockResolvedValue(mockDocument);

      mockRequest.body = {
        name: 'Test Document',
        category: 'academic',
      };

      // Act
      await controller.uploadDocument(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockService.uploadDocument).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockDocument,
          message: 'Document uploaded successfully',
        })
      );
    });

    it('should throw error when no file is uploaded', async () => {
      // Arrange
      mockRequest.file = undefined as any;
      mockRequest.body = {
        name: 'Test Document',
        category: 'academic',
      };

      // Act
      await controller.uploadDocument(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0] as Error;
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('No file uploaded');
    });

    it('should throw error when file size exceeds limit', async () => {
      // Arrange
      mockRequest.file = {
        fieldname: 'file',
        originalname: 'test.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 15 * 1024 * 1024, // 15MB
        buffer: Buffer.from('test'),
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };
      mockRequest.body = {
        name: 'Test Document',
        category: 'academic',
      };

      // Act
      await controller.uploadDocument(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0] as Error;
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('File size exceeds maximum limit');
    });

    it('should throw error when user is not authenticated', async () => {
      // Arrange
      mockRequest.user = undefined as any;

      // Act
      await controller.uploadDocument(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0] as Error;
      expect(error).toBeInstanceOf(AuthenticationError);
    });
  });

  describe('getDocument', () => {
    it('should return document by ID', async () => {
      // Arrange
      const mockDocument: Partial<Document> = {
        documentId: 1,
        documentNumber: 'DOC-2024-000001',
        name: 'Test Document',
        category: 'academic',
        accessLevel: 'public',
        uploadedBy: 1,
        status: 'active',
        isImage: () => false,
        isViewable: () => true,
        getActualSize: () => 1024,
        toJSON: function() { return this; },
      } as unknown as Document;

      mockService.getDocumentById = jest.fn().mockResolvedValue(mockDocument);

      mockRequest.params = { documentId: '1' };

      // Act
      await controller.getDocument(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockService.getDocumentById).toHaveBeenCalledWith(1, 1, ['School_Admin']);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockDocument,
      });
    });

    it('should throw error for invalid document ID', async () => {
      // Arrange
      mockRequest.params = { documentId: 'invalid' };

      // Act
      await controller.getDocument(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0] as Error;
      expect(error).toBeInstanceOf(ValidationError);
    });
  });

  describe('searchDocuments', () => {
    it('should search documents with filters', async () => {
      // Arrange
      const mockDocuments: Partial<Document>[] = [
        {
          documentId: 1,
          name: 'Math Notes',
          category: 'academic',
          accessLevel: 'public',
          uploadedBy: 1,
          status: 'active',
          isImage: () => false,
          isViewable: () => true,
          getActualSize: () => 1024,
          toJSON: function() { return this; },
        },
      ] as unknown as Document[];

      mockService.searchDocuments = jest.fn().mockResolvedValue({
        documents: mockDocuments,
        total: 1,
        page: 1,
        limit: 20,
      });

      mockRequest.query = {
        category: 'academic',
        page: '1',
        limit: '20',
      };

      // Act
      await controller.searchDocuments(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockService.searchDocuments).toHaveBeenCalledWith(
        { category: 'academic' },
        1,
        ['School_Admin'],
        1,
        20
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockDocuments,
          meta: expect.objectContaining({
            total: 1,
            page: 1,
            limit: 20,
          }),
        })
      );
    });
  });

  describe('updateDocument', () => {
    it('should update document metadata', async () => {
      // Arrange
      const mockDocument: Partial<Document> = {
        documentId: 1,
        name: 'Updated Document',
        description: 'New description',
        category: 'academic',
        accessLevel: 'restricted',
        uploadedBy: 1,
        status: 'active',
        isImage: () => false,
        isViewable: () => true,
        getActualSize: () => 1024,
        toJSON: function() { return this; },
      } as unknown as Document;

      mockService.updateDocument = jest.fn().mockResolvedValue(mockDocument);

      mockRequest.params = { documentId: '1' };
      mockRequest.body = {
        name: 'Updated Document',
        description: 'New description',
        accessLevel: 'restricted',
      };

      // Act
      await controller.updateDocument(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockService.updateDocument).toHaveBeenCalledWith(1, mockRequest.body, 1);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Document updated successfully',
        })
      );
    });

    it('should throw error for empty update body', async () => {
      // Arrange
      mockRequest.params = { documentId: '1' };
      mockRequest.body = {};

      // Act
      await controller.updateDocument(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0] as Error;
      expect(error).toBeInstanceOf(ValidationError);
    });
  });

  describe('deleteDocument', () => {
    it('should delete document successfully', async () => {
      // Arrange
      const mockDocument: Partial<Document> = {
        documentId: 1,
        status: 'deleted',
        isImage: () => false,
        isViewable: () => true,
        getActualSize: () => 1024,
        toJSON: function() { return this; },
      } as unknown as Document;

      mockService.deleteDocument = jest.fn().mockResolvedValue(mockDocument);

      mockRequest.params = { documentId: '1' };

      // Act
      await controller.deleteDocument(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockService.deleteDocument).toHaveBeenCalledWith(1, 1);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Document deleted successfully',
        })
      );
    });
  });

  describe('getDocumentVersions', () => {
    it('should return document versions', async () => {
      // Arrange
      const mockVersions: Partial<Document>[] = [
        { documentId: 1, version: 1 } as unknown as Document,
        { documentId: 2, version: 2 } as unknown as Document,
      ];

      mockService.getDocumentVersions = jest.fn().mockResolvedValue(mockVersions);

      mockRequest.params = { documentId: '1' };

      // Act
      await controller.getDocumentVersions(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockService.getDocumentVersions).toHaveBeenCalledWith(1);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockVersions,
      });
    });
  });

  describe('getStatistics', () => {
    it('should return document statistics', async () => {
      // Arrange
      const mockStats = {
        totalDocuments: 100,
        byCategory: { academic: 40, administrative: 30 },
        totalStorage: 1024 * 1024 * 500, // 500MB
      };

      mockService.getStatistics = jest.fn().mockResolvedValue(mockStats);

      // Act
      await controller.getStatistics(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats,
      });
    });
  });

  describe('previewDocument', () => {
    it('should return document preview', async () => {
      // Arrange
      const mockDocument: Partial<Document> = {
        documentId: 1,
        name: 'Test Document',
        isViewable: () => true,
        toJSON: function() { return this; },
      } as unknown as Document;

      mockService.previewDocument = jest.fn().mockResolvedValue({
        document: mockDocument,
        previewUrl: '/uploads/documents/test.pdf',
      });

      mockRequest.params = { documentId: '1' };

      // Act
      await controller.previewDocument(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          document: mockDocument,
          previewUrl: '/uploads/documents/test.pdf',
        },
      });
    });
  });

  describe('archiveDocument', () => {
    it('should archive document successfully', async () => {
      // Arrange
      const mockDocument: Partial<Document> = {
        documentId: 1,
        status: 'archived',
        isImage: () => false,
        isViewable: () => true,
        getActualSize: () => 1024,
        toJSON: function() { return this; },
      } as unknown as Document;

      mockService.archiveDocument = jest.fn().mockResolvedValue(mockDocument);

      mockRequest.params = { documentId: '1' };

      // Act
      await controller.archiveDocument(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockService.archiveDocument).toHaveBeenCalledWith(1, 1);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Document archived successfully',
        })
      );
    });
  });

  describe('getAccessLogs', () => {
    it('should return document access logs', async () => {
      // Arrange
      const mockLogs = [
        { accessLogId: 1, action: 'view' },
        { accessLogId: 2, action: 'download' },
      ];

      mockService.getAccessLogs = jest.fn().mockResolvedValue(mockLogs);

      mockRequest.params = { documentId: '1' };

      // Act
      await controller.getAccessLogs(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockLogs,
      });
    });
  });
});