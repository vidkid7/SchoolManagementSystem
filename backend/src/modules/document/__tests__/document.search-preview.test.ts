/**
 * Document Search and Preview Tests
 * 
 * Tests for document search by name/category and preview functionality
 * 
 * Task 29.3: Implement document search and preview
 * Requirements: 27.5, 27.6
 */

import { DocumentService } from '../document.service';
import { DocumentRepository } from '../document.repository';
import { Document } from '../../../models/Document.model';

// Mock dependencies
jest.mock('../document.repository');
jest.mock('fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('sharp', () => {
  return jest.fn().mockImplementation(() => ({
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('compressed-image-data')),
    toFile: jest.fn().mockResolvedValue(undefined),
  }));
});

describe('Document Search and Preview - Task 29.3', () => {
  let service: DocumentService;
  let mockRepository: jest.Mocked<DocumentRepository>;

  beforeEach(() => {
    mockRepository = new DocumentRepository() as jest.Mocked<DocumentRepository>;
    service = new DocumentService(
      mockRepository,
      'uploads/documents',
      10 * 1024 * 1024,
      500 * 1024
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Requirement 27.5: Search by name and category', () => {
    describe('Search by name', () => {
      it('should find documents by exact name match', async () => {
        // Arrange
        const mockDocuments: Partial<Document>[] = [
          {
            documentId: 1,
            name: 'Math Assignment',
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
          { search: 'Math Assignment' },
          1,
          ['student'],
          1,
          20
        );

        // Assert
        expect(result.documents).toHaveLength(1);
        expect(result.documents[0].name).toBe('Math Assignment');
        expect(mockRepository.findAll).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'Math Assignment' })
        );
      });

      it('should find documents by partial name match', async () => {
        // Arrange
        const mockDocuments: Partial<Document>[] = [
          {
            documentId: 1,
            name: 'Mathematics Assignment 1',
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
            name: 'Mathematics Quiz',
            category: 'exam',
            accessLevel: 'public',
            uploadedBy: 1,
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
          { search: 'Math' },
          1,
          ['student'],
          1,
          20
        );

        // Assert
        expect(result.documents).toHaveLength(2);
        expect(result.documents.every(doc => doc.name.includes('Math'))).toBe(true);
      });

      it('should return empty array when no documents match name search', async () => {
        // Arrange
        mockRepository.findAll = jest.fn().mockResolvedValue([]);

        // Act
        const result = await service.searchDocuments(
          { search: 'NonExistentDocument' },
          1,
          ['student'],
          1,
          20
        );

        // Assert
        expect(result.documents).toHaveLength(0);
        expect(result.total).toBe(0);
      });

      it('should search case-insensitively', async () => {
        // Arrange
        const mockDocuments: Partial<Document>[] = [
          {
            documentId: 1,
            name: 'PHYSICS NOTES',
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
          { search: 'physics' },
          1,
          ['student'],
          1,
          20
        );

        // Assert
        expect(result.documents).toHaveLength(1);
      });
    });

    describe('Search by category', () => {
      it('should find documents by category', async () => {
        // Arrange
        const mockDocuments: Partial<Document>[] = [
          {
            documentId: 1,
            name: 'Financial Report Q1',
            category: 'financial',
            accessLevel: 'restricted',
            allowedRoles: ['accountant'],
            uploadedBy: 1,
            status: 'active',
            isImage: () => false,
            isViewable: () => true,
            getActualSize: () => 1024,
            toJSON: function() { return this; },
          },
          {
            documentId: 2,
            name: 'Financial Report Q2',
            category: 'financial',
            accessLevel: 'restricted',
            allowedRoles: ['accountant'],
            uploadedBy: 1,
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
          { category: 'financial' },
          1,
          ['accountant'],
          1,
          20
        );

        // Assert
        expect(result.documents).toHaveLength(2);
        expect(result.documents.every(doc => doc.category === 'financial')).toBe(true);
        expect(mockRepository.findAll).toHaveBeenCalledWith(
          expect.objectContaining({ category: 'financial' })
        );
      });

      it('should support all document categories', async () => {
        // Arrange
        const categories = [
          'academic',
          'administrative',
          'financial',
          'student_record',
          'staff_record',
          'curriculum',
          'exam',
          'other',
        ];

        for (const category of categories) {
          const mockDocuments: Partial<Document>[] = [
            {
              documentId: 1,
              name: `Test ${category}`,
              category: category as any,
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
            { category },
            1,
            ['School_Admin'],
            1,
            20
          );

          // Assert
          expect(result.documents).toHaveLength(1);
          expect(result.documents[0].category).toBe(category);
        }
      });

      it('should return empty array when no documents match category', async () => {
        // Arrange
        mockRepository.findAll = jest.fn().mockResolvedValue([]);

        // Act
        const result = await service.searchDocuments(
          { category: 'financial' },
          1,
          ['student'],
          1,
          20
        );

        // Assert
        expect(result.documents).toHaveLength(0);
      });
    });

    describe('Combined search by name and category', () => {
      it('should find documents matching both name and category', async () => {
        // Arrange
        const mockDocuments: Partial<Document>[] = [
          {
            documentId: 1,
            name: 'Student Report Card',
            category: 'student_record',
            accessLevel: 'restricted',
            allowedRoles: ['teacher'],
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
          { search: 'Report', category: 'student_record' },
          1,
          ['subject_teacher'],
          1,
          20
        );

        // Assert
        expect(result.documents).toHaveLength(1);
        expect(result.documents[0].name).toContain('Report');
        expect(result.documents[0].category).toBe('student_record');
      });
    });

    describe('Search with access control', () => {
      it('should only return documents user has access to', async () => {
        // Arrange
        const mockDocuments: Partial<Document>[] = [
          {
            documentId: 1,
            name: 'Public Document',
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
            name: 'Private Document',
            category: 'academic',
            accessLevel: 'private',
            uploadedBy: 2,
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
          { category: 'academic' },
          1,
          ['student'],
          1,
          20
        );

        // Assert
        // Should only return public document
        expect(result.documents).toHaveLength(1);
        expect(result.documents[0].accessLevel).toBe('public');
      });
    });

    describe('Search pagination', () => {
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
          2,
          10
        );

        // Assert
        expect(result.documents).toHaveLength(10);
        expect(result.page).toBe(2);
        expect(result.limit).toBe(10);
        expect(result.total).toBe(50);
      });
    });
  });

  describe('Requirement 27.6: Document preview', () => {
    describe('Preview viewable documents', () => {
      it('should preview PDF documents', async () => {
        // Arrange
        const mockDocument: Partial<Document> = {
          documentId: 1,
          name: 'Test PDF',
          mimeType: 'application/pdf',
          storagePath: '/uploads/documents/test.pdf',
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
        const result = await service.previewDocument(1, 1, ['student']);

        // Assert
        expect(result.document).toBeDefined();
        expect(result.previewUrl).toBe('/uploads/documents/test.pdf');
        expect(mockRepository.logAccess).toHaveBeenCalledWith(
          expect.objectContaining({
            documentId: 1,
            userId: 1,
            action: 'preview',
            success: true,
          })
        );
      });

      it('should preview image documents', async () => {
        // Arrange
        const mockDocument: Partial<Document> = {
          documentId: 1,
          name: 'Test Image',
          mimeType: 'image/jpeg',
          storagePath: '/uploads/documents/test.jpg',
          accessLevel: 'public',
          uploadedBy: 1,
          status: 'active',
          isImage: () => true,
          isViewable: () => true,
          getActualSize: () => 1024,
          toJSON: function() { return this; },
        } as unknown as Document;

        mockRepository.findById = jest.fn().mockResolvedValue(mockDocument);
        mockRepository.logAccess = jest.fn().mockResolvedValue({} as any);

        // Act
        const result = await service.previewDocument(1, 1, ['student']);

        // Assert
        expect(result.document).toBeDefined();
        expect(result.previewUrl).toBe('/uploads/documents/test.jpg');
      });

      it('should preview text documents', async () => {
        // Arrange
        const mockDocument: Partial<Document> = {
          documentId: 1,
          name: 'Test Text',
          mimeType: 'text/plain',
          storagePath: '/uploads/documents/test.txt',
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
        const result = await service.previewDocument(1, 1, ['student']);

        // Assert
        expect(result.document).toBeDefined();
        expect(result.previewUrl).toBeDefined();
      });

      it('should preview Word documents', async () => {
        // Arrange
        const mockDocument: Partial<Document> = {
          documentId: 1,
          name: 'Test Word',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          storagePath: '/uploads/documents/test.docx',
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
        const result = await service.previewDocument(1, 1, ['student']);

        // Assert
        expect(result.document).toBeDefined();
        expect(result.previewUrl).toBeDefined();
      });
    });

    describe('Preview access control', () => {
      it('should enforce access control for preview', async () => {
        // Arrange
        const mockDocument: Partial<Document> = {
          documentId: 1,
          name: 'Private Document',
          mimeType: 'application/pdf',
          storagePath: '/uploads/documents/private.pdf',
          accessLevel: 'private',
          uploadedBy: 2,
          status: 'active',
          isImage: () => false,
          isViewable: () => true,
          getActualSize: () => 1024,
          toJSON: function() { return this; },
        } as unknown as Document;

        mockRepository.findById = jest.fn().mockResolvedValue(mockDocument);

        // Act & Assert
        await expect(
          service.previewDocument(1, 1, ['student'])
        ).rejects.toThrow('You do not have permission to access this document');
      });

      it('should allow owner to preview private documents', async () => {
        // Arrange
        const mockDocument: Partial<Document> = {
          documentId: 1,
          name: 'My Private Document',
          mimeType: 'application/pdf',
          storagePath: '/uploads/documents/private.pdf',
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
        const result = await service.previewDocument(1, 1, ['student']);

        // Assert
        expect(result.document).toBeDefined();
        expect(result.previewUrl).toBeDefined();
      });

      it('should allow admin to preview any document', async () => {
        // Arrange
        const mockDocument: Partial<Document> = {
          documentId: 1,
          name: 'Private Document',
          mimeType: 'application/pdf',
          storagePath: '/uploads/documents/private.pdf',
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
        const result = await service.previewDocument(1, 999, ['School_Admin']);

        // Assert
        expect(result.document).toBeDefined();
        expect(result.previewUrl).toBeDefined();
      });
    });

    describe('Preview non-viewable documents', () => {
      it('should throw error for non-viewable document types', async () => {
        // Arrange
        const mockDocument: Partial<Document> = {
          documentId: 1,
          name: 'Binary File',
          mimeType: 'application/octet-stream',
          storagePath: '/uploads/documents/binary.bin',
          accessLevel: 'public',
          uploadedBy: 1,
          status: 'active',
          isImage: () => false,
          isViewable: () => false,
          getActualSize: () => 1024,
          toJSON: function() { return this; },
        } as unknown as Document;

        mockRepository.findById = jest.fn().mockResolvedValue(mockDocument);
        mockRepository.logAccess = jest.fn().mockResolvedValue({} as any);

        // Act & Assert
        await expect(
          service.previewDocument(1, 1, ['student'])
        ).rejects.toThrow('Document type is not viewable');
      });
    });

    describe('Preview logging', () => {
      it('should log preview access', async () => {
        // Arrange
        const mockDocument: Partial<Document> = {
          documentId: 1,
          name: 'Test Document',
          mimeType: 'application/pdf',
          storagePath: '/uploads/documents/test.pdf',
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
        await service.previewDocument(1, 5, ['student']);

        // Assert
        expect(mockRepository.logAccess).toHaveBeenCalledWith(
          expect.objectContaining({
            documentId: 1,
            userId: 5,
            action: 'preview',
            success: true,
          })
        );
      });

      it('should log both view and preview actions', async () => {
        // Arrange
        const mockDocument: Partial<Document> = {
          documentId: 1,
          name: 'Test Document',
          mimeType: 'application/pdf',
          storagePath: '/uploads/documents/test.pdf',
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
        await service.previewDocument(1, 5, ['student']);

        // Assert
        // Should log view action first (from getDocumentById)
        expect(mockRepository.logAccess).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'view',
          })
        );
        // Then log preview action
        expect(mockRepository.logAccess).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'preview',
          })
        );
        expect(mockRepository.logAccess).toHaveBeenCalledTimes(2);
      });
    });

    describe('Preview error handling', () => {
      it('should throw error for non-existent document', async () => {
        // Arrange
        mockRepository.findById = jest.fn().mockResolvedValue(null);

        // Act & Assert
        await expect(
          service.previewDocument(999, 1, ['student'])
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
          service.previewDocument(1, 1, ['student'])
        ).rejects.toThrow('Document has been deleted');
      });
    });
  });
});
