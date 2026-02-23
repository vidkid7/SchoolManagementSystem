/**
 * Document Access Control Tests
 * 
 * Comprehensive tests for role-based access control and access logging
 * 
 * Requirements: 27.4
 */

import { DocumentService } from '../document.service';
import { DocumentRepository } from '../document.repository';
import { Document } from '../../../models/Document.model';
import { DocumentAccessLog } from '../../../models/DocumentAccessLog.model';

// Mock dependencies
jest.mock('../document.repository');
jest.mock('fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
}));

describe('Document Access Control', () => {
  let service: DocumentService;
  let mockRepository: jest.Mocked<DocumentRepository>;

  beforeEach(() => {
    mockRepository = new DocumentRepository() as jest.Mocked<DocumentRepository>;
    service = new DocumentService(mockRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Role-Based Access Control', () => {
    describe('Public Documents', () => {
      it('should allow any authenticated user to access public documents', async () => {
        // Arrange
        const mockDocument: Partial<Document> = {
          documentId: 1,
          documentNumber: 'DOC-2024-000001',
          name: 'Public Document',
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
        expect(result.documentId).toBe(1);
        expect(mockRepository.logAccess).toHaveBeenCalledWith(
          expect.objectContaining({
            documentId: 1,
            userId: 999,
            action: 'view',
            success: true,
          })
        );
      });

      it('should allow teachers to access public documents', async () => {
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

        const result = await service.getDocumentById(1, 5, ['subject_teacher']);
        expect(result).toBeDefined();
      });

      it('should allow parents to access public documents', async () => {
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

        const result = await service.getDocumentById(1, 10, ['parent']);
        expect(result).toBeDefined();
      });
    });

    describe('Private Documents', () => {
      it('should allow document owner to access private documents', async () => {
        const mockDocument: Partial<Document> = {
          documentId: 1,
          accessLevel: 'private',
          uploadedBy: 5,
          status: 'active',
          isImage: () => false,
          isViewable: () => true,
          getActualSize: () => 1024,
          toJSON: function() { return this; },
        } as unknown as Document;

        mockRepository.findById = jest.fn().mockResolvedValue(mockDocument);
        mockRepository.logAccess = jest.fn().mockResolvedValue({} as any);

        const result = await service.getDocumentById(1, 5, ['student']);
        expect(result).toBeDefined();
      });

      it('should deny non-owner access to private documents', async () => {
        const mockDocument: Partial<Document> = {
          documentId: 1,
          accessLevel: 'private',
          uploadedBy: 5,
          status: 'active',
          isImage: () => false,
          isViewable: () => true,
          getActualSize: () => 1024,
          toJSON: function() { return this; },
        } as unknown as Document;

        mockRepository.findById = jest.fn().mockResolvedValue(mockDocument);

        await expect(
          service.getDocumentById(1, 10, ['student'])
        ).rejects.toThrow('You do not have permission to access this document');
      });

      it('should allow School_Admin to access any private document', async () => {
        const mockDocument: Partial<Document> = {
          documentId: 1,
          accessLevel: 'private',
          uploadedBy: 5,
          status: 'active',
          isImage: () => false,
          isViewable: () => true,
          getActualSize: () => 1024,
          toJSON: function() { return this; },
        } as unknown as Document;

        mockRepository.findById = jest.fn().mockResolvedValue(mockDocument);
        mockRepository.logAccess = jest.fn().mockResolvedValue({} as any);

        const result = await service.getDocumentById(1, 1, ['School_Admin']);
        expect(result).toBeDefined();
      });
    });

    describe('Restricted Documents - Role-Based', () => {
      it('should allow access when user has allowed role', async () => {
        const mockDocument: Partial<Document> = {
          documentId: 1,
          accessLevel: 'restricted',
          uploadedBy: 1,
          allowedRoles: ['teacher', 'accountant'],
          status: 'active',
          isImage: () => false,
          isViewable: () => true,
          getActualSize: () => 1024,
          toJSON: function() { return this; },
        } as unknown as Document;

        mockRepository.findById = jest.fn().mockResolvedValue(mockDocument);
        mockRepository.logAccess = jest.fn().mockResolvedValue({} as any);

        const result = await service.getDocumentById(1, 5, ['subject_teacher']);
        expect(result).toBeDefined();
      });

      it('should deny access when user does not have allowed role', async () => {
        const mockDocument: Partial<Document> = {
          documentId: 1,
          accessLevel: 'restricted',
          uploadedBy: 1,
          allowedRoles: ['teacher', 'accountant'],
          status: 'active',
          isImage: () => false,
          isViewable: () => true,
          getActualSize: () => 1024,
          toJSON: function() { return this; },
        } as unknown as Document;

        mockRepository.findById = jest.fn().mockResolvedValue(mockDocument);

        await expect(
          service.getDocumentById(1, 5, ['student'])
        ).rejects.toThrow('You do not have permission to access this document');
      });

      it('should allow access for class_teacher when teacher role is allowed', async () => {
        const mockDocument: Partial<Document> = {
          documentId: 1,
          accessLevel: 'restricted',
          uploadedBy: 1,
          allowedRoles: ['teacher'],
          status: 'active',
          isImage: () => false,
          isViewable: () => true,
          getActualSize: () => 1024,
          toJSON: function() { return this; },
        } as unknown as Document;

        mockRepository.findById = jest.fn().mockResolvedValue(mockDocument);
        mockRepository.logAccess = jest.fn().mockResolvedValue({} as any);

        const result = await service.getDocumentById(1, 5, ['class_teacher']);
        expect(result).toBeDefined();
      });

      it('should handle multiple allowed roles', async () => {
        const mockDocument: Partial<Document> = {
          documentId: 1,
          accessLevel: 'restricted',
          uploadedBy: 1,
          allowedRoles: ['teacher', 'librarian', 'accountant'],
          status: 'active',
          isImage: () => false,
          isViewable: () => true,
          getActualSize: () => 1024,
          toJSON: function() { return this; },
        } as unknown as Document;

        mockRepository.findById = jest.fn().mockResolvedValue(mockDocument);
        mockRepository.logAccess = jest.fn().mockResolvedValue({} as any);

        const result = await service.getDocumentById(1, 5, ['librarian']);
        expect(result).toBeDefined();
      });
    });

    describe('Restricted Documents - User-Based', () => {
      it('should allow access when user ID is in allowed list', async () => {
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

        const result = await service.getDocumentById(1, 10, ['student']);
        expect(result).toBeDefined();
      });

      it('should deny access when user ID is not in allowed list', async () => {
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

        await expect(
          service.getDocumentById(1, 20, ['student'])
        ).rejects.toThrow('You do not have permission to access this document');
      });

      it('should allow access when both role and user ID match', async () => {
        const mockDocument: Partial<Document> = {
          documentId: 1,
          accessLevel: 'restricted',
          uploadedBy: 1,
          allowedRoles: ['teacher'],
          allowedUserIds: [5, 10],
          status: 'active',
          isImage: () => false,
          isViewable: () => true,
          getActualSize: () => 1024,
          toJSON: function() { return this; },
        } as unknown as Document;

        mockRepository.findById = jest.fn().mockResolvedValue(mockDocument);
        mockRepository.logAccess = jest.fn().mockResolvedValue({} as any);

        // User has allowed role
        const result1 = await service.getDocumentById(1, 20, ['subject_teacher']);
        expect(result1).toBeDefined();

        // User has allowed ID
        const result2 = await service.getDocumentById(1, 10, ['student']);
        expect(result2).toBeDefined();
      });
    });

    describe('Admin Override', () => {
      it('should allow School_Admin to access any document regardless of access level', async () => {
        const testCases = [
          { accessLevel: 'public' as const, uploadedBy: 5 },
          { accessLevel: 'private' as const, uploadedBy: 5 },
          { accessLevel: 'restricted' as const, uploadedBy: 5, allowedRoles: ['teacher'] },
          { accessLevel: 'restricted' as const, uploadedBy: 5, allowedUserIds: [10, 20] },
        ];

        for (const testCase of testCases) {
          const mockDocument: Partial<Document> = {
            documentId: 1,
            ...testCase,
            status: 'active',
            isImage: () => false,
            isViewable: () => true,
            getActualSize: () => 1024,
            toJSON: function() { return this; },
          } as unknown as Document;

          mockRepository.findById = jest.fn().mockResolvedValue(mockDocument);
          mockRepository.logAccess = jest.fn().mockResolvedValue({} as any);

          const result = await service.getDocumentById(1, 1, ['School_Admin']);
          expect(result).toBeDefined();
        }
      });
    });
  });

  describe('Access Logging', () => {
    it('should log successful document view', async () => {
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

      await service.getDocumentById(1, 5, ['student']);

      expect(mockRepository.logAccess).toHaveBeenCalledWith(
        expect.objectContaining({
          documentId: 1,
          userId: 5,
          action: 'view',
          success: true,
        })
      );
    });

    it('should log document download', async () => {
      const mockDocument: Partial<Document> = {
        documentId: 1,
        accessLevel: 'public',
        uploadedBy: 1,
        status: 'active',
        storagePath: '/uploads/test.pdf',
        originalName: 'test.pdf',
        isImage: () => false,
        isViewable: () => true,
        getActualSize: () => 1024,
        toJSON: function() { return this; },
      } as unknown as Document;

      mockRepository.findById = jest.fn().mockResolvedValue(mockDocument);
      mockRepository.logAccess = jest.fn().mockResolvedValue({} as any);

      await service.downloadDocument(1, 5, ['student']);

      expect(mockRepository.logAccess).toHaveBeenCalledWith(
        expect.objectContaining({
          documentId: 1,
          userId: 5,
          action: 'download',
          success: true,
        })
      );
    });

    it('should log document preview', async () => {
      const mockDocument: Partial<Document> = {
        documentId: 1,
        accessLevel: 'public',
        uploadedBy: 1,
        status: 'active',
        storagePath: '/uploads/test.pdf',
        isImage: () => false,
        isViewable: () => true,
        getActualSize: () => 1024,
        toJSON: function() { return this; },
      } as unknown as Document;

      mockRepository.findById = jest.fn().mockResolvedValue(mockDocument);
      mockRepository.logAccess = jest.fn().mockResolvedValue({} as any);

      await service.previewDocument(1, 5, ['student']);

      expect(mockRepository.logAccess).toHaveBeenCalledWith(
        expect.objectContaining({
          documentId: 1,
          userId: 5,
          action: 'preview',
          success: true,
        })
      );
    });

    it('should log document upload', async () => {
      const mockDocument: Partial<Document> = {
        documentId: 1,
        documentNumber: 'DOC-2024-000001',
        name: 'Test',
        originalName: 'test.pdf',
        category: 'academic',
        mimeType: 'application/pdf',
        size: 1024,
        storagePath: '/uploads/test.pdf',
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

      mockRepository.existsByDocumentNumber = jest.fn().mockResolvedValue(false);
      mockRepository.create = jest.fn().mockResolvedValue(mockDocument);
      mockRepository.logAccess = jest.fn().mockResolvedValue({} as any);

      await service.uploadDocument({
        name: 'Test',
        originalName: 'test.pdf',
        category: 'academic',
        mimeType: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('test'),
        uploadedBy: 1,
      });

      expect(mockRepository.logAccess).toHaveBeenCalledWith(
        expect.objectContaining({
          documentId: 1,
          userId: 1,
          action: 'upload',
          success: true,
        })
      );
    });

    it('should log document edit', async () => {
      const mockDocument: Partial<Document> = {
        documentId: 1,
        name: 'Updated',
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

      await service.updateDocument(1, { name: 'Updated' }, 1);

      expect(mockRepository.logAccess).toHaveBeenCalledWith(
        expect.objectContaining({
          documentId: 1,
          userId: 1,
          action: 'edit',
          success: true,
          details: { changes: { name: 'Updated' } },
        })
      );
    });

    it('should log document delete', async () => {
      const mockDocument: Partial<Document> = {
        documentId: 1,
        uploadedBy: 1,
        status: 'deleted',
        isImage: () => false,
        isViewable: () => true,
        getActualSize: () => 1024,
        toJSON: function() { return this; },
      } as unknown as Document;

      mockRepository.findById = jest.fn().mockResolvedValue(mockDocument);
      mockRepository.softDelete = jest.fn().mockResolvedValue(mockDocument);
      mockRepository.logAccess = jest.fn().mockResolvedValue({} as any);

      await service.deleteDocument(1, 1);

      expect(mockRepository.logAccess).toHaveBeenCalledWith(
        expect.objectContaining({
          documentId: 1,
          userId: 1,
          action: 'delete',
          success: true,
        })
      );
    });
  });

  describe('Access Log Retrieval', () => {
    it('should allow document owner to view access logs', async () => {
      const mockDocument: Partial<Document> = {
        documentId: 1,
        uploadedBy: 5,
        isImage: () => false,
        isViewable: () => true,
        getActualSize: () => 1024,
        toJSON: function() { return this; },
      } as unknown as Document;

      const mockLogs: Partial<DocumentAccessLog>[] = [
        {
          accessLogId: 1,
          documentId: 1,
          userId: 5,
          action: 'view',
          success: true,
          createdAt: new Date(),
        },
        {
          accessLogId: 2,
          documentId: 1,
          userId: 10,
          action: 'download',
          success: true,
          createdAt: new Date(),
        },
      ] as DocumentAccessLog[];

      mockRepository.findById = jest.fn().mockResolvedValue(mockDocument);
      mockRepository.getAccessLogs = jest.fn().mockResolvedValue(mockLogs);

      const result = await service.getAccessLogs(1, 5, ['student']);

      expect(result).toHaveLength(2);
      expect(mockRepository.getAccessLogs).toHaveBeenCalledWith({ documentId: 1 });
    });

    it('should allow School_Admin to view any document access logs', async () => {
      const mockDocument: Partial<Document> = {
        documentId: 1,
        uploadedBy: 5,
        isImage: () => false,
        isViewable: () => true,
        getActualSize: () => 1024,
        toJSON: function() { return this; },
      } as unknown as Document;

      const mockLogs: Partial<DocumentAccessLog>[] = [
        {
          accessLogId: 1,
          documentId: 1,
          userId: 5,
          action: 'view',
          success: true,
          createdAt: new Date(),
        },
      ] as DocumentAccessLog[];

      mockRepository.findById = jest.fn().mockResolvedValue(mockDocument);
      mockRepository.getAccessLogs = jest.fn().mockResolvedValue(mockLogs);

      const result = await service.getAccessLogs(1, 1, ['School_Admin']);

      expect(result).toHaveLength(1);
    });

    it('should deny non-owner access to view access logs', async () => {
      const mockDocument: Partial<Document> = {
        documentId: 1,
        uploadedBy: 5,
        isImage: () => false,
        isViewable: () => true,
        getActualSize: () => 1024,
        toJSON: function() { return this; },
      } as unknown as Document;

      mockRepository.findById = jest.fn().mockResolvedValue(mockDocument);

      await expect(
        service.getAccessLogs(1, 10, ['student'])
      ).rejects.toThrow('You do not have permission to view access logs');
    });
  });
});
