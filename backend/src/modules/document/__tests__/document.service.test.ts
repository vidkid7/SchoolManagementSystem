/**
 * Document Service Unit Tests
 * 
 * Tests for document upload, access control, search, and versioning
 * 
 * Requirements: 27.1, 27.2, 27.3, 27.4, 27.5, 27.6, 27.7, 27.8
 */

import { DocumentService, UploadDocumentDTO, UpdateDocumentDTO } from '../document.service';
import { DocumentRepository } from '../document.repository';
import { Document } from '../../../models/Document.model';

// Mock dependencies
jest.mock('../document.repository');
jest.mock('fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
  unlink: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('sharp', () => {
  return jest.fn().mockImplementation(() => ({
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('compressed-image-data')),
    toFile: jest.fn().mockResolvedValue(undefined),
  }));
});

describe('DocumentService', () => {
  let service: DocumentService;
  let mockRepository: jest.Mocked<DocumentRepository>;

  beforeEach(() => {
    mockRepository = new DocumentRepository() as jest.Mocked<DocumentRepository>;
    service = new DocumentService(
      mockRepository,
      'uploads/documents',
      10 * 1024 * 1024, // 10MB
      500 * 1024 // 500KB
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadDocument', () => {
    it('should upload a document successfully', async () => {
      // Arrange
      const mockDocument: Partial<Document> = {
        documentId: 1,
        documentNumber: 'DOC-2024-000001',
        name: 'Test Document',
        originalName: 'test.pdf',
        category: 'academic',
        mimeType: 'application/pdf',
        size: 1024 * 1024, // 1MB
        storagePath: '/uploads/documents/DOC-2024-000001.pdf',
        version: 1,
        uploadedBy: 1,
        accessLevel: 'private',
        isCompressed: false,
        status: 'active',
        isImage: () => false,
        isViewable: () => true,
        getActualSize: () => 1024 * 1024,
        toJSON: function() { return this; },
      } as unknown as Document;

      mockRepository.existsByDocumentNumber = jest.fn().mockResolvedValue(false);
      mockRepository.create = jest.fn().mockResolvedValue(mockDocument);
      mockRepository.logAccess = jest.fn().mockResolvedValue({} as any);

      const dto: UploadDocumentDTO = {
        name: 'Test Document',
        originalName: 'test.pdf',
        category: 'academic',
        mimeType: 'application/pdf',
        size: 1024 * 1024,
        buffer: Buffer.from('test document content'),
        uploadedBy: 1,
      };

      // Act
      const result = await service.uploadDocument(dto);

      // Assert
      expect(result).toBeDefined();
      expect(result.documentNumber).toMatch(/^DOC-\d{4}-\d{6}$/);
      expect(result.name).toBe('Test Document');
      expect(result.category).toBe('academic');
      expect(mockRepository.create).toHaveBeenCalled();
    });

    it('should throw error if file size exceeds limit', async () => {
      // Arrange
      const dto: UploadDocumentDTO = {
        name: 'Large Document',
        originalName: 'large.pdf',
        category: 'academic',
        mimeType: 'application/pdf',
        size: 15 * 1024 * 1024, // 15MB - exceeds 10MB limit
        buffer: Buffer.from('test'),
        uploadedBy: 1,
      };

      // Act & Assert
      await expect(service.uploadDocument(dto)).rejects.toThrow(
        'File size exceeds maximum limit of 10MB'
      );
    });

    it('should compress image documents', async () => {
      // Arrange
      const mockDocument: Partial<Document> = {
        documentId: 1,
        documentNumber: 'DOC-2024-000001',
        name: 'Test Image',
        originalName: 'test.jpg',
        category: 'academic',
        mimeType: 'image/jpeg',
        size: 800 * 1024, // 800KB
        compressedSize: 400 * 1024, // 400KB after compression
        storagePath: '/uploads/documents/DOC-2024-000001.jpg',
        version: 1,
        uploadedBy: 1,
        accessLevel: 'private',
        isCompressed: true,
        compressionRatio: 0.5,
        status: 'active',
        isImage: () => true,
        isViewable: () => true,
        getActualSize: () => 400 * 1024,
        toJSON: function() { return this; },
      } as unknown as Document;

      mockRepository.existsByDocumentNumber = jest.fn().mockResolvedValue(false);
      mockRepository.create = jest.fn().mockResolvedValue(mockDocument);
      mockRepository.logAccess = jest.fn().mockResolvedValue({} as any);

      const dto: UploadDocumentDTO = {
        name: 'Test Image',
        originalName: 'test.jpg',
        category: 'academic',
        mimeType: 'image/jpeg',
        size: 800 * 1024,
        buffer: Buffer.from('image data'),
        uploadedBy: 1,
      };

      // Act
      const result = await service.uploadDocument(dto);

      // Assert
      expect(result.isCompressed).toBe(true);
      expect(result.compressedSize).toBeDefined();
    });

    it('should generate unique document numbers', async () => {
      // Arrange
      const mockDocument: Partial<Document> = {
        documentId: 1,
        documentNumber: 'DOC-2024-000001',
        name: 'Test',
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

      // First call returns true (exists), second returns false (unique)
      mockRepository.existsByDocumentNumber = jest.fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);
      mockRepository.create = jest.fn().mockResolvedValue(mockDocument);
      mockRepository.logAccess = jest.fn().mockResolvedValue({} as any);

      const dto: UploadDocumentDTO = {
        name: 'Test',
        originalName: 'test.pdf',
        category: 'academic',
        mimeType: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('test'),
        uploadedBy: 1,
      };

      // Act
      await service.uploadDocument(dto);

      // Assert
      expect(mockRepository.existsByDocumentNumber).toHaveBeenCalledTimes(2);
    });
  });

  describe('getDocumentById', () => {
    it('should return document for authorized user', async () => {
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

      mockRepository.findById = jest.fn().mockResolvedValue(mockDocument);
      mockRepository.logAccess = jest.fn().mockResolvedValue({} as any);

      // Act
      const result = await service.getDocumentById(1, 2, ['student']);

      // Assert
      expect(result).toBeDefined();
      expect(result.documentId).toBe(1);
    });

    it('should throw error for non-existent document', async () => {
      // Arrange
      mockRepository.findById = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.getDocumentById(999, 1, ['student'])
      ).rejects.toThrow('Document with ID 999 not found');
    });

    it('should throw error for deleted document', async () => {
      // Arrange
      const mockDocument: Partial<Document> = {
        documentId: 1,
        status: 'deleted',
        isImage: () => false,
        isViewable: () => true,
        getActualSize: () => 1024,
        toJSON: function() { return this; },
      } as unknown as Document;

      mockRepository.findById = jest.fn().mockResolvedValue(mockDocument);

      // Act & Assert
      await expect(
        service.getDocumentById(1, 1, ['student'])
      ).rejects.toThrow('Document has been deleted');
    });

    it('should allow access to public documents for any user', async () => {
      // Arrange
      const mockDocument: Partial<Document> = {
        documentId: 1,
        accessLevel: 'public',
        uploadedBy: 1,
        status: 'active',
        isImage: () => false,
        isViewable: () => true,
        getActualSize: () => 1024,
        toJSON: function() { return this; },
      } as unknown as Document;

      mockRepository.findById = jest.fn().mockResolvedValue(mockDocument);
      mockRepository.logAccess = jest.fn().mockResolvedValue({} as any);

      // Act
      const result = await service.getDocumentById(1, 999, ['student']);

      // Assert
      expect(result).toBeDefined();
    });

    it('should allow owner access to private documents', async () => {
      // Arrange
      const mockDocument: Partial<Document> = {
        documentId: 1,
        accessLevel: 'private',
        uploadedBy: 1,
        status: 'active',
        isImage: () => false,
        isViewable: () => true,
        getActualSize: () => 1024,
        toJSON: function() { return this; },
      } as unknown as Document;

      mockRepository.findById = jest.fn().mockResolvedValue(mockDocument);
      mockRepository.logAccess = jest.fn().mockResolvedValue({} as any);

      // Act
      const result = await service.getDocumentById(1, 1, ['student']);

      // Assert
      expect(result).toBeDefined();
    });

    it('should allow admin access to any document', async () => {
      // Arrange
      const mockDocument: Partial<Document> = {
        documentId: 1,
        accessLevel: 'private',
        uploadedBy: 2,
        status: 'active',
        isImage: () => false,
        isViewable: () => true,
        getActualSize: () => 1024,
        toJSON: function() { return this; },
      } as unknown as Document;

      mockRepository.findById = jest.fn().mockResolvedValue(mockDocument);
      mockRepository.logAccess = jest.fn().mockResolvedValue({} as any);

      // Act
      const result = await service.getDocumentById(1, 999, ['School_Admin']);

      // Assert
      expect(result).toBeDefined();
    });

    it('should deny access to private documents for unauthorized users', async () => {
      // Arrange
      const mockDocument: Partial<Document> = {
        documentId: 1,
        accessLevel: 'private',
        uploadedBy: 1,
        status: 'active',
        isImage: () => false,
        isViewable: () => true,
        getActualSize: () => 1024,
        toJSON: function() { return this; },
      } as unknown as Document;

      mockRepository.findById = jest.fn().mockResolvedValue(mockDocument);

      // Act & Assert
      await expect(
        service.getDocumentById(1, 999, ['student'])
      ).rejects.toThrow('You do not have permission to access this document');
    });

    it('should allow access to restricted documents for users with allowed roles', async () => {
      // Arrange
      const mockDocument: Partial<Document> = {
        documentId: 1,
        accessLevel: 'restricted',
        uploadedBy: 1,
        allowedRoles: ['teacher', 'School_Admin'],
        status: 'active',
        isImage: () => false,
        isViewable: () => true,
        getActualSize: () => 1024,
        toJSON: function() { return this; },
      } as unknown as Document;

      mockRepository.findById = jest.fn().mockResolvedValue(mockDocument);
      mockRepository.logAccess = jest.fn().mockResolvedValue({} as any);

      // Act
      const result = await service.getDocumentById(1, 2, ['subject_teacher']);

      // Assert
      expect(result).toBeDefined();
    });

    it('should allow access to restricted documents for users with allowed user IDs', async () => {
      // Arrange
      const mockDocument: Partial<Document> = {
        documentId: 1,
        accessLevel: 'restricted',
        uploadedBy: 1,
        allowedUserIds: [5, 10, 15],
        status: 'active',
        isImage: () => false,
        isViewable: () => true,
        getActualSize: () => 1024,
        toJSON: function() { return this; },
      } as unknown as Document;

      mockRepository.findById = jest.fn().mockResolvedValue(mockDocument);
      mockRepository.logAccess = jest.fn().mockResolvedValue({} as any);

      // Act
      const result = await service.getDocumentById(1, 10, ['student']);

      // Assert
      expect(result).toBeDefined();
    });
  });

  describe('searchDocuments', () => {
    it('should search documents by name', async () => {
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

      mockRepository.findAll = jest.fn().mockResolvedValue(mockDocuments);

      // Act
      const result = await service.searchDocuments(
        { search: 'Math' },
        1,
        ['student'],
        1,
        20
      );

      // Assert
      expect(result.documents).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter documents by category', async () => {
      // Arrange
      const mockDocuments: Partial<Document>[] = [
        {
          documentId: 1,
          name: 'Financial Report',
          category: 'financial',
          accessLevel: 'public',
          uploadedBy: 1,
          status: 'active',
          isImage: () => false,
          isViewable: () => true,
          getActualSize: () => 1024,
          toJSON: function() { return this; },
        },
      ] as unknown as Document[];

      mockRepository.findAll = jest.fn().mockResolvedValue(mockDocuments);

      // Act
      const result = await service.searchDocuments(
        { category: 'financial' },
        1,
        ['accountant'],
        1,
        20
      );

      // Assert
      expect(result.documents).toHaveLength(1);
      expect(result.documents[0].category).toBe('financial');
    });

    it('should paginate search results', async () => {
      // Arrange
      const mockDocuments = Array.from({ length: 50 }, (_, i) => ({
        documentId: i + 1,
        name: `Document ${i + 1}`,
        category: 'academic',
        accessLevel: 'public',
        uploadedBy: 1,
        status: 'active',
        isImage: () => false,
        isViewable: () => true,
        getActualSize: () => 1024,
        toJSON: function() { return this; },
      })) as unknown as Document[];

      mockRepository.findAll = jest.fn().mockResolvedValue(mockDocuments);

      // Act
      const result = await service.searchDocuments(
        {},
        1,
        ['student'],
        1,
        10
      );

      // Assert
      expect(result.documents).toHaveLength(10);
      expect(result.total).toBe(50);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should filter by access control', async () => {
      // Arrange
      const mockDocuments: Partial<Document>[] = [
        {
          documentId: 1,
          name: 'Public Doc',
          category: 'academic',
          accessLevel: 'public',
          uploadedBy: 1,
          status: 'active',
          isImage: () => false,
          isViewable: () => true,
          getActualSize: () => 1024,
          toJSON: function() { return this; },
        },
        {
          documentId: 2,
          name: 'Private Doc',
          category: 'academic',
          accessLevel: 'private',
          uploadedBy: 3,
          status: 'active',
          isImage: () => false,
          isViewable: () => true,
          getActualSize: () => 2048,
          toJSON: function() { return this; },
        },
      ] as unknown as Document[];

      mockRepository.findAll = jest.fn().mockResolvedValue(mockDocuments);

      // Act
      const result = await service.searchDocuments(
        {},
        1,
        ['student'],
        1,
        20
      );

      // Assert
      // Only public document should be accessible
      expect(result.documents).toHaveLength(1);
      expect(result.documents[0].name).toBe('Public Doc');
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

      mockRepository.findById = jest.fn().mockResolvedValue(mockDocument);
      mockRepository.update = jest.fn().mockResolvedValue(mockDocument);
      mockRepository.logAccess = jest.fn().mockResolvedValue({} as any);

      const dto: UpdateDocumentDTO = {
        name: 'Updated Document',
        description: 'New description',
        accessLevel: 'restricted',
      };

      // Act
      const result = await service.updateDocument(1, dto, 1);

      // Assert
      expect(result).toBeDefined();
      expect(mockRepository.update).toHaveBeenCalledWith(1, dto);
    });

    it('should throw error for non-existent document', async () => {
      // Arrange
      mockRepository.findById = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.updateDocument(999, { name: 'Test' }, 1)
      ).rejects.toThrow('Document with ID 999 not found');
    });

    it('should throw error for deleted document', async () => {
      // Arrange
      const mockDocument: Partial<Document> = {
        documentId: 1,
        status: 'deleted',
        isImage: () => false,
        isViewable: () => true,
        getActualSize: () => 1024,
        toJSON: function() { return this; },
      } as unknown as Document;

      mockRepository.findById = jest.fn().mockResolvedValue(mockDocument);

      // Act & Assert
      await expect(
        service.updateDocument(1, { name: 'Test' }, 1)
      ).rejects.toThrow('Cannot update deleted document');
    });
  });

  describe('deleteDocument', () => {
    it('should soft delete document', async () => {
      // Arrange
      const mockDocument: Partial<Document> = {
        documentId: 1,
        status: 'deleted',
        isImage: () => false,
        isViewable: () => true,
        getActualSize: () => 1024,
        toJSON: function() { return this; },
      } as unknown as Document;

      mockRepository.findById = jest.fn().mockResolvedValue(mockDocument);
      mockRepository.softDelete = jest.fn().mockResolvedValue(mockDocument);
      mockRepository.logAccess = jest.fn().mockResolvedValue({} as any);

      // Act
      const result = await service.deleteDocument(1, 1);

      // Assert
      expect(result.status).toBe('deleted');
      expect(mockRepository.softDelete).toHaveBeenCalledWith(1);
    });

    it('should throw error for non-existent document', async () => {
      // Arrange
      mockRepository.findById = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(service.deleteDocument(999, 1)).rejects.toThrow(
        'Document with ID 999 not found'
      );
    });
  });

  describe('getDocumentVersions', () => {
    it('should return all versions of a document', async () => {
      // Arrange
      const mockDocument: Partial<Document> = {
        documentId: 1,
        documentNumber: 'DOC-2024-000001',
        isImage: () => false,
        isViewable: () => true,
        getActualSize: () => 1024,
        toJSON: function() { return this; },
      } as unknown as Document;

      const mockVersions: Partial<Document>[] = [
        { documentId: 1, version: 1, documentNumber: 'DOC-2024-000001' } as unknown as Document,
        { documentId: 2, version: 2, documentNumber: 'DOC-2024-000001' } as unknown as Document,
        { documentId: 3, version: 3, documentNumber: 'DOC-2024-000001' } as unknown as Document,
      ];

      mockRepository.findById = jest.fn().mockResolvedValue(mockDocument);
      mockRepository.findVersions = jest.fn().mockResolvedValue(mockVersions);

      // Act
      const result = await service.getDocumentVersions(1);

      // Assert
      expect(result).toHaveLength(3);
      expect(mockRepository.findVersions).toHaveBeenCalledWith(1);
    });

    it('should return empty array for non-existent document', async () => {
      // Arrange
      mockRepository.findVersions = jest.fn().mockResolvedValue([]);

      // Act
      const result = await service.getDocumentVersions(999);

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('getStatistics', () => {
    it('should return document statistics', async () => {
      // Arrange
      mockRepository.getTotalCount = jest.fn().mockResolvedValue(100);
      mockRepository.getCountByCategory = jest.fn().mockResolvedValue({
        academic: 40,
        administrative: 30,
        financial: 20,
        other: 10,
      });
      mockRepository.findAll = jest.fn().mockResolvedValue([
        { size: 1024, compressedSize: 512, isCompressed: true } as Document,
        { size: 2048, compressedSize: 1024, isCompressed: true } as Document,
      ]);

      // Act
      const result = await service.getStatistics();

      // Assert
      expect(result.totalDocuments).toBe(100);
      expect(result.byCategory).toEqual({
        academic: 40,
        administrative: 30,
        financial: 20,
        other: 10,
      });
      expect(result.totalStorage).toBe(1536); // 512 + 1024
    });
  });

  describe('uploadVersion', () => {
    it('should create new version of document', async () => {
      // Arrange
      const parentDocument: Partial<Document> = {
        documentId: 1,
        documentNumber: 'DOC-2024-000001',
        name: 'Original Document',
        category: 'academic',
        accessLevel: 'private',
        uploadedBy: 1,
        isImage: () => false,
        isViewable: () => true,
        getActualSize: () => 1024,
        toJSON: function() { return this; },
      } as unknown as Document;

      const newVersion: Partial<Document> = {
        documentId: 2,
        documentNumber: 'DOC-2024-000001',
        name: 'Original Document',
        category: 'academic',
        version: 2,
        parentDocumentId: 1,
        uploadedBy: 1,
        isImage: () => false,
        isViewable: () => true,
        getActualSize: () => 2048,
        toJSON: function() { return this; },
      } as unknown as Document;

      mockRepository.findById = jest.fn().mockResolvedValue(parentDocument);
      mockRepository.getLatestVersion = jest.fn().mockResolvedValue(1);
      mockRepository.create = jest.fn().mockResolvedValue(newVersion);

      // Act
      const result = await service.uploadVersion(1, {
        name: 'Updated Document',
        originalName: 'updated.pdf',
        mimeType: 'application/pdf',
        size: 2048,
        buffer: Buffer.from('updated content'),
      });

      // Assert
      expect(result.version).toBe(2);
      expect(result.parentDocumentId).toBe(1);
    });

    it('should throw error for non-existent parent document', async () => {
      // Arrange
      mockRepository.findById = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.uploadVersion(999, {
          name: 'Test Document',
          originalName: 'test.pdf',
          mimeType: 'application/pdf',
          size: 1024,
          buffer: Buffer.from('test'),
        })
      ).rejects.toThrow('Document with ID 999 not found');
    });
  });
});