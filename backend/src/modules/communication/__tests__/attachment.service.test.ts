/**
 * Attachment Service Tests
 * 
 * Tests for message attachment upload functionality
 * 
 * Requirements: 24.4
 */

import path from 'path';
import fs from 'fs';
import { attachmentService, AttachmentMetadata } from '../attachment.service';

/**
 * Helper to create mock multer file
 */
function createMockFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  const buffer = Buffer.from('test file content');
  return {
    fieldname: 'files',
    originalname: 'test-file.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: buffer.length,
    buffer,
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
    ...overrides,
  };
}

/**
 * Helper to create mock image file
 */
function createMockImageFile(): Express.Multer.File {
  // Create a minimal valid JPEG buffer (1x1 pixel red image)
  const jpegBuffer = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
    0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
    0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
    0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
    0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x03, 0xFF, 0xC4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00,
    0x37, 0xFF, 0xD9
  ]);

  return {
    fieldname: 'files',
    originalname: 'test-image.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: jpegBuffer.length,
    buffer: jpegBuffer,
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
  };
}

describe('AttachmentService', () => {
  const TEST_ATTACHMENTS_DIR = path.join(process.cwd(), 'uploads', 'attachments', 'messages');
  const TEST_USER_ID = 999999;

  beforeAll(() => {
    // Ensure test directory exists
    if (!fs.existsSync(TEST_ATTACHMENTS_DIR)) {
      fs.mkdirSync(TEST_ATTACHMENTS_DIR, { recursive: true });
    }
  });

  afterAll(() => {
    // Clean up test files
    const testUserDir = path.join(TEST_ATTACHMENTS_DIR, String(TEST_USER_ID));
    if (fs.existsSync(testUserDir)) {
      const files = fs.readdirSync(testUserDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(testUserDir, file));
      });
      fs.rmdirSync(testUserDir);
    }
  });

  describe('processAttachment', () => {
    it('should process and save a document attachment', async () => {
      const mockFile = createMockFile({
        originalname: 'test-document.pdf',
        mimetype: 'application/pdf',
      });

      const result = await attachmentService.processAttachment(mockFile, TEST_USER_ID);

      expect(result).toHaveProperty('type', 'document');
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('name', 'test-document.pdf');
      expect(result).toHaveProperty('size');
      expect(result).toHaveProperty('mimeType', 'application/pdf');
      expect(result).toHaveProperty('uploadedAt');
      expect(result.url).toContain(`/uploads/attachments/messages/${TEST_USER_ID}/`);

      // Verify file was created
      const filePath = path.join(process.cwd(), result.url);
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should process and save an image attachment', async () => {
      const mockFile = createMockImageFile();

      const result = await attachmentService.processAttachment(mockFile, TEST_USER_ID);

      expect(result).toHaveProperty('type', 'image');
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('name', 'test-image.jpg');
      expect(result).toHaveProperty('mimeType', 'image/jpeg');
      expect(result.url).toContain(`/uploads/attachments/messages/${TEST_USER_ID}/`);

      // Verify file was created
      const filePath = path.join(process.cwd(), result.url);
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should handle video file type', async () => {
      const mockFile = createMockFile({
        originalname: 'test-video.mp4',
        mimetype: 'video/mp4',
      });

      const result = await attachmentService.processAttachment(mockFile, TEST_USER_ID);

      expect(result.type).toBe('video');
      expect(result.mimeType).toBe('video/mp4');
    });

    it('should handle audio file type', async () => {
      const mockFile = createMockFile({
        originalname: 'test-audio.mp3',
        mimetype: 'audio/mpeg',
      });

      const result = await attachmentService.processAttachment(mockFile, TEST_USER_ID);

      expect(result.type).toBe('audio');
      expect(result.mimeType).toBe('audio/mpeg');
    });

    it('should generate unique filenames', async () => {
      const mockFile1 = createMockFile({ originalname: 'same-name.pdf' });
      const mockFile2 = createMockFile({ originalname: 'same-name.pdf' });

      const result1 = await attachmentService.processAttachment(mockFile1, TEST_USER_ID);
      const result2 = await attachmentService.processAttachment(mockFile2, TEST_USER_ID);

      expect(result1.url).not.toBe(result2.url);
    });
  });

  describe('processMultipleAttachments', () => {
    it('should process multiple attachments', async () => {
      const mockFiles = [
        createMockFile({ originalname: 'file1.pdf' }),
        createMockFile({ originalname: 'file2.pdf' }),
        createMockFile({ originalname: 'file3.pdf' }),
      ];

      const results = await attachmentService.processMultipleAttachments(mockFiles, TEST_USER_ID);

      expect(results).toHaveLength(3);
      expect(results[0].name).toBe('file1.pdf');
      expect(results[1].name).toBe('file2.pdf');
      expect(results[2].name).toBe('file3.pdf');

      // Verify all files were created
      results.forEach(result => {
        const filePath = path.join(process.cwd(), result.url);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    it('should continue processing even if one file fails', async () => {
      const mockFiles = [
        createMockFile({ originalname: 'file1.pdf' }),
        createMockFile({ originalname: 'file2.pdf', buffer: Buffer.from('') }), // Empty buffer might cause issues
        createMockFile({ originalname: 'file3.pdf' }),
      ];

      const results = await attachmentService.processMultipleAttachments(mockFiles, TEST_USER_ID);

      // Should process at least the valid files
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('deleteAttachment', () => {
    it('should delete an attachment file', async () => {
      const mockFile = createMockFile({ originalname: 'to-delete.pdf' });
      const result = await attachmentService.processAttachment(mockFile, TEST_USER_ID);

      const filePath = path.join(process.cwd(), result.url);
      expect(fs.existsSync(filePath)).toBe(true);

      await attachmentService.deleteAttachment(result.url);

      expect(fs.existsSync(filePath)).toBe(false);
    });

    it('should handle deleting non-existent file gracefully', async () => {
      await expect(
        attachmentService.deleteAttachment('/uploads/attachments/messages/999999/nonexistent.pdf')
      ).resolves.not.toThrow();
    });
  });

  describe('deleteMultipleAttachments', () => {
    it('should delete multiple attachments', async () => {
      const mockFiles = [
        createMockFile({ originalname: 'delete1.pdf' }),
        createMockFile({ originalname: 'delete2.pdf' }),
      ];

      const attachments = await attachmentService.processMultipleAttachments(mockFiles, TEST_USER_ID);

      // Verify files exist
      attachments.forEach(attachment => {
        const filePath = path.join(process.cwd(), attachment.url);
        expect(fs.existsSync(filePath)).toBe(true);
      });

      await attachmentService.deleteMultipleAttachments(attachments);

      // Verify files are deleted
      attachments.forEach(attachment => {
        const filePath = path.join(process.cwd(), attachment.url);
        expect(fs.existsSync(filePath)).toBe(false);
      });
    });
  });

  describe('validateAttachments', () => {
    it('should validate valid attachments', () => {
      const attachments: AttachmentMetadata[] = [
        {
          type: 'document',
          url: '/uploads/attachments/messages/1/file.pdf',
          name: 'file.pdf',
          size: 1024,
          mimeType: 'application/pdf',
          uploadedAt: new Date(),
        },
      ];

      expect(() => attachmentService.validateAttachments(attachments)).not.toThrow();
    });

    it('should reject non-array input', () => {
      expect(() => attachmentService.validateAttachments({} as any)).toThrow('Attachments must be an array');
    });

    it('should reject more than 5 attachments', () => {
      const attachments = Array(6).fill({
        type: 'document',
        url: '/uploads/attachments/messages/1/file.pdf',
        name: 'file.pdf',
        size: 1024,
        mimeType: 'application/pdf',
        uploadedAt: new Date(),
      });

      expect(() => attachmentService.validateAttachments(attachments)).toThrow('Maximum 5 attachments allowed');
    });

    it('should reject invalid attachment type', () => {
      const attachments = [
        {
          type: 'invalid',
          url: '/uploads/attachments/messages/1/file.pdf',
          name: 'file.pdf',
          size: 1024,
          mimeType: 'application/pdf',
          uploadedAt: new Date(),
        },
      ];

      expect(() => attachmentService.validateAttachments(attachments)).toThrow('Invalid attachment type');
    });

    it('should reject attachment exceeding size limit', () => {
      const attachments = [
        {
          type: 'document',
          url: '/uploads/attachments/messages/1/file.pdf',
          name: 'file.pdf',
          size: 11 * 1024 * 1024, // 11MB
          mimeType: 'application/pdf',
          uploadedAt: new Date(),
        },
      ];

      expect(() => attachmentService.validateAttachments(attachments)).toThrow('exceeds maximum size');
    });

    it('should reject attachment with missing metadata', () => {
      const attachments = [
        {
          type: 'document',
          url: '/uploads/attachments/messages/1/file.pdf',
          // Missing name, size, etc.
        },
      ];

      expect(() => attachmentService.validateAttachments(attachments as any)).toThrow('Invalid attachment metadata');
    });
  });

  describe('attachmentExists', () => {
    it('should return true for existing attachment', async () => {
      const mockFile = createMockFile({ originalname: 'exists.pdf' });
      const result = await attachmentService.processAttachment(mockFile, TEST_USER_ID);

      expect(attachmentService.attachmentExists(result.url)).toBe(true);
    });

    it('should return false for non-existent attachment', () => {
      expect(attachmentService.attachmentExists('/uploads/attachments/messages/999999/nonexistent.pdf')).toBe(false);
    });
  });

  describe('getAttachmentPath', () => {
    it('should return full file path from URL', () => {
      const url = '/uploads/attachments/messages/123/file.pdf';
      const fullPath = attachmentService.getAttachmentPath(url);

      expect(fullPath).toContain('uploads');
      expect(fullPath).toContain('attachments');
      expect(fullPath).toContain('messages');
      expect(fullPath).toContain('123');
      expect(fullPath).toContain('file.pdf');
    });
  });
});
