import staffDocumentService from '../staffDocument.service';
import StaffDocument, { StaffDocumentCategory } from '@models/StaffDocument.model';

// Mock dependencies BEFORE importing modules that use them
jest.mock('@utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  promises: {
    writeFile: jest.fn(),
    unlink: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn()
  },
  stat: jest.fn((_path, callback) => callback(null, { isDirectory: () => false })),
  createWriteStream: jest.fn()
}));

describe('StaffDocumentService', () => {
  const fs = require('fs');
  
  const mockFile: Express.Multer.File = {
    fieldname: 'document',
    originalname: 'test-certificate.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1024 * 100, // 100KB
    buffer: Buffer.from('mock file content'),
    stream: {} as any,
    destination: '',
    filename: '',
    path: ''
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock fs methods
    fs.existsSync.mockReturnValue(false);
    fs.mkdirSync.mockImplementation(() => undefined);
    fs.promises.writeFile.mockResolvedValue(undefined);
    fs.promises.unlink.mockResolvedValue(undefined);
    fs.promises.readdir.mockResolvedValue([]);
    fs.promises.stat.mockResolvedValue({ isDirectory: () => true });
  });

  describe('uploadDocument', () => {
    it('should upload a new document successfully', async () => {
      const mockDocument = {
        documentId: 1,
        staffId: 1,
        category: StaffDocumentCategory.CERTIFICATE,
        documentName: 'Teaching Certificate',
        originalFileName: 'test-certificate.pdf',
        documentUrl: '/uploads/documents/staff/1/certificate/certificate-v1-123456-abc123.pdf',
        fileSize: 102400,
        mimeType: 'application/pdf',
        version: 1,
        isLatest: true,
        uploadedBy: 1,
        description: 'B.Ed Certificate',
        expiryDate: undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock database operations
      jest.spyOn(StaffDocument, 'findOne').mockResolvedValue(null);
      jest.spyOn(StaffDocument, 'update').mockResolvedValue([0] as any);
      jest.spyOn(StaffDocument, 'create').mockResolvedValue(mockDocument as any);

      const result = await staffDocumentService.uploadDocument(
        mockFile,
        1,
        StaffDocumentCategory.CERTIFICATE,
        'Teaching Certificate',
        1,
        'B.Ed Certificate'
      );

      expect(result).toBeDefined();
      expect(result.staffId).toBe(1);
      expect(result.category).toBe(StaffDocumentCategory.CERTIFICATE);
      expect(result.version).toBe(1);
      expect(result.isLatest).toBe(true);
      expect(fs.promises.writeFile).toHaveBeenCalled();
    });

    it('should create a new version when uploading same document', async () => {
      const existingDoc = {
        documentId: 1,
        staffId: 1,
        category: StaffDocumentCategory.CERTIFICATE,
        documentName: 'Teaching Certificate',
        version: 1,
        isLatest: true
      };

      const newVersionDoc = {
        documentId: 2,
        staffId: 1,
        category: StaffDocumentCategory.CERTIFICATE,
        documentName: 'Teaching Certificate',
        version: 2,
        isLatest: true,
        originalFileName: 'test-certificate.pdf',
        documentUrl: '/uploads/documents/staff/1/certificate/certificate-v2-123456-abc123.pdf',
        fileSize: 102400,
        mimeType: 'application/pdf'
      };

      jest.spyOn(StaffDocument, 'findOne').mockResolvedValue(existingDoc as any);
      jest.spyOn(StaffDocument, 'update').mockResolvedValue([1] as any);
      jest.spyOn(StaffDocument, 'create').mockResolvedValue(newVersionDoc as any);

      const result = await staffDocumentService.uploadDocument(
        mockFile,
        1,
        StaffDocumentCategory.CERTIFICATE,
        'Teaching Certificate',
        1
      );

      expect(result.version).toBe(2);
      expect(result.isLatest).toBe(true);
      expect(StaffDocument.update).toHaveBeenCalledWith(
        { isLatest: false },
        expect.objectContaining({
          where: expect.objectContaining({
            staffId: 1,
            category: StaffDocumentCategory.CERTIFICATE,
            documentName: 'Teaching Certificate',
            isLatest: true
          })
        })
      );
    });

    it('should handle file upload errors', async () => {
      fs.promises.writeFile.mockRejectedValue(new Error('Disk full'));

      await expect(
        staffDocumentService.uploadDocument(
          mockFile,
          1,
          StaffDocumentCategory.CERTIFICATE,
          'Teaching Certificate',
          1
        )
      ).rejects.toThrow('Failed to upload staff document');
    });
  });

  describe('getDocuments', () => {
    it('should retrieve all documents for a staff member', async () => {
      const mockDocuments = [
        {
          documentId: 1,
          staffId: 1,
          category: StaffDocumentCategory.CERTIFICATE,
          documentName: 'Teaching Certificate',
          version: 1,
          isLatest: true
        },
        {
          documentId: 2,
          staffId: 1,
          category: StaffDocumentCategory.CONTRACT,
          documentName: 'Employment Contract',
          version: 1,
          isLatest: true
        }
      ];

      jest.spyOn(StaffDocument, 'findAll').mockResolvedValue(mockDocuments as any);

      const result = await staffDocumentService.getDocuments(1);

      expect(result).toHaveLength(2);
      expect(result[0].category).toBe(StaffDocumentCategory.CERTIFICATE);
      expect(result[1].category).toBe(StaffDocumentCategory.CONTRACT);
    });

    it('should filter documents by category', async () => {
      const mockDocuments = [
        {
          documentId: 1,
          staffId: 1,
          category: StaffDocumentCategory.CERTIFICATE,
          documentName: 'Teaching Certificate',
          version: 1,
          isLatest: true
        }
      ];

      jest.spyOn(StaffDocument, 'findAll').mockResolvedValue(mockDocuments as any);

      const result = await staffDocumentService.getDocuments(1, {
        category: StaffDocumentCategory.CERTIFICATE
      });

      expect(result).toHaveLength(1);
      expect(result[0].category).toBe(StaffDocumentCategory.CERTIFICATE);
    });

    it('should return only latest versions when latestOnly is true', async () => {
      const mockDocuments = [
        {
          documentId: 2,
          staffId: 1,
          category: StaffDocumentCategory.CERTIFICATE,
          documentName: 'Teaching Certificate',
          version: 2,
          isLatest: true
        }
      ];

      jest.spyOn(StaffDocument, 'findAll').mockResolvedValue(mockDocuments as any);

      const result = await staffDocumentService.getDocuments(1, {
        latestOnly: true
      });

      expect(result).toHaveLength(1);
      expect(result[0].isLatest).toBe(true);
    });

    it('should exclude expired documents by default', async () => {
      const mockDocuments = [
        {
          documentId: 1,
          staffId: 1,
          category: StaffDocumentCategory.CONTRACT,
          documentName: 'Employment Contract',
          version: 1,
          isLatest: true,
          expiryDate: new Date(Date.now() + 86400000) // Tomorrow
        }
      ];

      jest.spyOn(StaffDocument, 'findAll').mockResolvedValue(mockDocuments as any);

      const result = await staffDocumentService.getDocuments(1);

      expect(result).toHaveLength(1);
      expect(StaffDocument.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            staffId: 1
          })
        })
      );
    });
  });

  describe('getDocumentVersions', () => {
    it('should retrieve all versions of a document', async () => {
      const mockVersions = [
        {
          documentId: 3,
          staffId: 1,
          category: StaffDocumentCategory.CERTIFICATE,
          documentName: 'Teaching Certificate',
          version: 3,
          isLatest: true
        },
        {
          documentId: 2,
          staffId: 1,
          category: StaffDocumentCategory.CERTIFICATE,
          documentName: 'Teaching Certificate',
          version: 2,
          isLatest: false
        },
        {
          documentId: 1,
          staffId: 1,
          category: StaffDocumentCategory.CERTIFICATE,
          documentName: 'Teaching Certificate',
          version: 1,
          isLatest: false
        }
      ];

      jest.spyOn(StaffDocument, 'findAll').mockResolvedValue(mockVersions as any);

      const result = await staffDocumentService.getDocumentVersions(
        1,
        StaffDocumentCategory.CERTIFICATE,
        'Teaching Certificate'
      );

      expect(result).toHaveLength(3);
      expect(result[0].version).toBe(3);
      expect(result[1].version).toBe(2);
      expect(result[2].version).toBe(1);
    });
  });

  describe('updateDocument', () => {
    it('should update document metadata', async () => {
      const mockDocument = {
        documentId: 1,
        staffId: 1,
        category: StaffDocumentCategory.CERTIFICATE,
        documentName: 'Teaching Certificate',
        description: 'Old description',
        update: jest.fn().mockResolvedValue(undefined)
      };

      jest.spyOn(StaffDocument, 'findByPk').mockResolvedValue(mockDocument as any);

      const result = await staffDocumentService.updateDocument(1, {
        description: 'Updated description',
        expiryDate: new Date('2025-12-31')
      });

      expect(result).toBeDefined();
      expect(mockDocument.update).toHaveBeenCalledWith({
        description: 'Updated description',
        expiryDate: new Date('2025-12-31')
      });
    });

    it('should return null if document not found', async () => {
      jest.spyOn(StaffDocument, 'findByPk').mockResolvedValue(null);

      const result = await staffDocumentService.updateDocument(999, {
        description: 'Updated description'
      });

      expect(result).toBeNull();
    });
  });

  describe('deleteDocument', () => {
    it('should soft delete a document', async () => {
      const mockDocument = {
        documentId: 1,
        staffId: 1,
        destroy: jest.fn().mockResolvedValue(undefined)
      };

      jest.spyOn(StaffDocument, 'findByPk').mockResolvedValue(mockDocument as any);

      const result = await staffDocumentService.deleteDocument(1);

      expect(result).toBe(true);
      expect(mockDocument.destroy).toHaveBeenCalled();
    });

    it('should return false if document not found', async () => {
      jest.spyOn(StaffDocument, 'findByPk').mockResolvedValue(null);

      const result = await staffDocumentService.deleteDocument(999);

      expect(result).toBe(false);
    });
  });

  describe('getExpiredDocuments', () => {
    it('should retrieve expired documents', async () => {
      const yesterday = new Date(Date.now() - 86400000);
      const mockExpiredDocs = [
        {
          documentId: 1,
          staffId: 1,
          category: StaffDocumentCategory.CONTRACT,
          documentName: 'Employment Contract',
          expiryDate: yesterday,
          isLatest: true
        }
      ];

      jest.spyOn(StaffDocument, 'findAll').mockResolvedValue(mockExpiredDocs as any);

      const result = await staffDocumentService.getExpiredDocuments();

      expect(result).toHaveLength(1);
      expect(result[0].expiryDate).toEqual(yesterday);
    });

    it('should filter expired documents by staff ID', async () => {
      const yesterday = new Date(Date.now() - 86400000);
      const mockExpiredDocs = [
        {
          documentId: 1,
          staffId: 1,
          category: StaffDocumentCategory.CONTRACT,
          documentName: 'Employment Contract',
          expiryDate: yesterday,
          isLatest: true
        }
      ];

      jest.spyOn(StaffDocument, 'findAll').mockResolvedValue(mockExpiredDocs as any);

      const result = await staffDocumentService.getExpiredDocuments(1);

      expect(result).toHaveLength(1);
      expect(result[0].staffId).toBe(1);
    });
  });

  describe('getDocumentsExpiringSoon', () => {
    it('should retrieve documents expiring within specified days', async () => {
      const futureDate = new Date(Date.now() + 15 * 86400000); // 15 days from now
      const mockDocs = [
        {
          documentId: 1,
          staffId: 1,
          category: StaffDocumentCategory.CONTRACT,
          documentName: 'Employment Contract',
          expiryDate: futureDate,
          isLatest: true
        }
      ];

      jest.spyOn(StaffDocument, 'findAll').mockResolvedValue(mockDocs as any);

      const result = await staffDocumentService.getDocumentsExpiringSoon(30);

      expect(result).toHaveLength(1);
      expect(result[0].expiryDate).toEqual(futureDate);
    });

    it('should use default 30 days if not specified', async () => {
      jest.spyOn(StaffDocument, 'findAll').mockResolvedValue([]);

      await staffDocumentService.getDocumentsExpiringSoon();

      expect(StaffDocument.findAll).toHaveBeenCalled();
    });
  });

  describe('getDocumentStatistics', () => {
    it('should calculate document statistics correctly', async () => {
      const expired = new Date(Date.now() - 86400000);
      const expiringSoon = new Date(Date.now() + 15 * 86400000);
      const notExpiring = new Date(Date.now() + 60 * 86400000);

      const mockDocuments = [
        {
          documentId: 1,
          staffId: 1,
          category: StaffDocumentCategory.CERTIFICATE,
          fileSize: 1024 * 100,
          expiryDate: null,
          isLatest: true
        },
        {
          documentId: 2,
          staffId: 1,
          category: StaffDocumentCategory.CONTRACT,
          fileSize: 1024 * 200,
          expiryDate: expired,
          isLatest: true
        },
        {
          documentId: 3,
          staffId: 1,
          category: StaffDocumentCategory.ID_PROOF,
          fileSize: 1024 * 50,
          expiryDate: expiringSoon,
          isLatest: true
        },
        {
          documentId: 4,
          staffId: 1,
          category: StaffDocumentCategory.CERTIFICATE,
          fileSize: 1024 * 150,
          expiryDate: notExpiring,
          isLatest: true
        }
      ];

      jest.spyOn(StaffDocument, 'findAll').mockResolvedValue(mockDocuments as any);

      const result = await staffDocumentService.getDocumentStatistics(1);

      expect(result.totalDocuments).toBe(4);
      expect(result.byCategory[StaffDocumentCategory.CERTIFICATE]).toBe(2);
      expect(result.byCategory[StaffDocumentCategory.CONTRACT]).toBe(1);
      expect(result.byCategory[StaffDocumentCategory.ID_PROOF]).toBe(1);
      expect(result.totalSize).toBe(1024 * 500); // Sum of all file sizes
      expect(result.expiredCount).toBe(1);
      expect(result.expiringSoonCount).toBe(1);
    });

    it('should handle staff with no documents', async () => {
      jest.spyOn(StaffDocument, 'findAll').mockResolvedValue([]);

      const result = await staffDocumentService.getDocumentStatistics(1);

      expect(result.totalDocuments).toBe(0);
      expect(result.byCategory).toEqual({});
      expect(result.totalSize).toBe(0);
      expect(result.expiredCount).toBe(0);
      expect(result.expiringSoonCount).toBe(0);
    });
  });

  describe('bulkUploadDocuments', () => {
    it('should upload multiple documents', async () => {
      const mockFiles: Express.Multer.File[] = [
        { ...mockFile, originalname: 'cert1.pdf' },
        { ...mockFile, originalname: 'cert2.pdf' }
      ];

      const mockDocs = [
        {
          documentId: 1,
          staffId: 1,
          category: StaffDocumentCategory.CERTIFICATE,
          originalFileName: 'cert1.pdf',
          version: 1,
          isLatest: true
        },
        {
          documentId: 2,
          staffId: 1,
          category: StaffDocumentCategory.CERTIFICATE,
          originalFileName: 'cert2.pdf',
          version: 1,
          isLatest: true
        }
      ];

      jest.spyOn(StaffDocument, 'findOne').mockResolvedValue(null);
      jest.spyOn(StaffDocument, 'update').mockResolvedValue([0] as any);
      jest.spyOn(StaffDocument, 'create')
        .mockResolvedValueOnce(mockDocs[0] as any)
        .mockResolvedValueOnce(mockDocs[1] as any);

      const result = await staffDocumentService.bulkUploadDocuments(
        mockFiles,
        1,
        StaffDocumentCategory.CERTIFICATE,
        1
      );

      expect(result).toHaveLength(2);
      expect(result[0].originalFileName).toBe('cert1.pdf');
      expect(result[1].originalFileName).toBe('cert2.pdf');
    });

    it('should continue uploading even if one file fails', async () => {
      const mockFiles: Express.Multer.File[] = [
        { ...mockFile, originalname: 'cert1.pdf' },
        { ...mockFile, originalname: 'cert2.pdf' }
      ];

      jest.spyOn(StaffDocument, 'findOne').mockResolvedValue(null);
      jest.spyOn(StaffDocument, 'update').mockResolvedValue([0] as any);
      jest.spyOn(StaffDocument, 'create')
        .mockRejectedValueOnce(new Error('Upload failed'))
        .mockResolvedValueOnce({
          documentId: 2,
          staffId: 1,
          category: StaffDocumentCategory.CERTIFICATE,
          originalFileName: 'cert2.pdf'
        } as any);

      const result = await staffDocumentService.bulkUploadDocuments(
        mockFiles,
        1,
        StaffDocumentCategory.CERTIFICATE,
        1
      );

      expect(result).toHaveLength(1);
      expect(result[0].originalFileName).toBe('cert2.pdf');
    });
  });
});
