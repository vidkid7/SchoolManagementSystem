import photoService from '../photo.service';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { Readable } from 'stream';

/**
 * Helper to create mock multer file
 */
function createMockFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  const buffer = Buffer.from('test');
  return {
    fieldname: 'photo',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: buffer.length,
    buffer: buffer,
    destination: '/tmp',
    filename: `test-${Date.now()}.jpg`,
    path: `/tmp/test-${Date.now()}.jpg`,
    stream: Readable.from(buffer),
    ...overrides
  };
}

/**
 * Photo Service Tests
 * Tests for student photo upload functionality
 * Requirements: 2.12, 29.2
 */

describe('PhotoService', () => {
  const TEST_PHOTO_DIR = path.join(process.cwd(), 'uploads', 'test-photos');
  const TEST_STUDENT_ID = 999999;

  beforeAll(() => {
    // Ensure test directory exists
    if (!fs.existsSync(TEST_PHOTO_DIR)) {
      fs.mkdirSync(TEST_PHOTO_DIR, { recursive: true });
    }
  });

  afterAll(() => {
    // Cleanup test directory
    if (fs.existsSync(TEST_PHOTO_DIR)) {
      fs.rmSync(TEST_PHOTO_DIR, { recursive: true, force: true });
    }
  });

  describe('processStudentPhoto', () => {
    it('should process and save a valid JPEG photo', async () => {
      // Create a test JPEG image buffer (100x100 red pixel)
      const imageBuffer = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 255, g: 0, b: 0 }
        }
      })
        .jpeg()
        .toBuffer();

      const mockFile = createMockFile({
        originalname: 'test-photo.jpg',
        mimetype: 'image/jpeg',
        size: imageBuffer.length,
        buffer: imageBuffer
      });

      const result = await photoService.processStudentPhoto(mockFile, TEST_STUDENT_ID);

      expect(result.photoUrl).toContain(`/uploads/students/${TEST_STUDENT_ID}/`);
      expect(result.thumbnailUrl).toContain(`/uploads/students/${TEST_STUDENT_ID}/thumb-`);
      expect(result.photoUrl).not.toBe(result.thumbnailUrl);

      // Clean up created files
      const photoPath = path.join(process.cwd(), result.photoUrl);
      const thumbPath = path.join(process.cwd(), result.thumbnailUrl);
      if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
      if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
    });

    it('should process and save a valid PNG photo', async () => {
      const imageBuffer = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 4,
          background: { r: 0, g: 255, b: 0, alpha: 1 }
        }
      })
        .png()
        .toBuffer();

      const mockFile = createMockFile({
        originalname: 'test-photo.png',
        mimetype: 'image/png',
        size: imageBuffer.length,
        buffer: imageBuffer
      });

      const result = await photoService.processStudentPhoto(mockFile, TEST_STUDENT_ID);

      expect(result.photoUrl).toContain(`/uploads/students/${TEST_STUDENT_ID}/`);
      expect(result.thumbnailUrl).toContain(`/uploads/students/${TEST_STUDENT_ID}/thumb-`);

      // Clean up
      const photoPath = path.join(process.cwd(), result.photoUrl);
      const thumbPath = path.join(process.cwd(), result.thumbnailUrl);
      if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
      if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
    });

    it('should generate thumbnails with correct dimensions', async () => {
      const imageBuffer = await sharp({
        create: {
          width: 300,
          height: 200,
          channels: 3,
          background: { r: 0, g: 0, b: 255 }
        }
      })
        .jpeg()
        .toBuffer();

      const mockFile = createMockFile({
        originalname: 'test-photo.jpg',
        mimetype: 'image/jpeg',
        size: imageBuffer.length,
        buffer: imageBuffer
      });

      const result = await photoService.processStudentPhoto(mockFile, TEST_STUDENT_ID);

      // Verify thumbnail was created and has expected dimensions (150x150)
      const thumbPath = path.join(process.cwd(), result.thumbnailUrl);
      expect(fs.existsSync(thumbPath)).toBe(true);

      const thumbnailMeta = await sharp(thumbPath).metadata();
      expect(thumbnailMeta.width).toBe(150);
      expect(thumbnailMeta.height).toBe(150);

      // Clean up
      const photoPath = path.join(process.cwd(), result.photoUrl);
      if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
      if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
    });

    it('should compress large images to under 200KB', async () => {
      // Create a large image (800x600)
      const imageBuffer = await sharp({
        create: {
          width: 800,
          height: 600,
          channels: 3,
          background: { r: 128, g: 128, b: 128 }
        }
      })
        .jpeg({ quality: 100 })
        .toBuffer();

      const mockFile = createMockFile({
        originalname: 'large-photo.jpg',
        mimetype: 'image/jpeg',
        size: imageBuffer.length,
        buffer: imageBuffer
      });

      const result = await photoService.processStudentPhoto(mockFile, TEST_STUDENT_ID);

      const photoPath = path.join(process.cwd(), result.photoUrl);
      const fileStats = fs.statSync(photoPath);
      const fileSizeKB = fileStats.size / 1024;

      // Photo should be under 200KB
      expect(fileSizeKB).toBeLessThan(200);

      // Clean up
      const thumbPath = path.join(process.cwd(), result.thumbnailUrl);
      if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
      if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
    });
  });

  describe('deleteStudentPhoto', () => {
    it('should delete photo and thumbnail files', async () => {
      // First create a test photo
      const imageBuffer = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 255, g: 255, b: 0 }
        }
      })
        .jpeg()
        .toBuffer();

      const mockFile = createMockFile({
        originalname: 'test-delete.jpg',
        mimetype: 'image/jpeg',
        size: imageBuffer.length,
        buffer: imageBuffer
      });

      const result = await photoService.processStudentPhoto(mockFile, TEST_STUDENT_ID);

      // Verify files exist
      const photoPath = path.join(process.cwd(), result.photoUrl);
      const thumbPath = path.join(process.cwd(), result.thumbnailUrl);
      expect(fs.existsSync(photoPath)).toBe(true);
      expect(fs.existsSync(thumbPath)).toBe(true);

      // Delete the photo
      await photoService.deleteStudentPhoto(result.photoUrl);

      // Verify files are deleted
      expect(fs.existsSync(photoPath)).toBe(false);
      expect(fs.existsSync(thumbPath)).toBe(false);
    });

    it('should handle non-existent photo gracefully', async () => {
      await expect(
        photoService.deleteStudentPhoto('/uploads/students/999999/nonexistent.jpg')
      ).resolves.not.toThrow();
    });
  });

  describe('saveStudentDocument', () => {
    it('should save document with category folder', async () => {
      // Create a simple PDF-like buffer
      const docBuffer = Buffer.from('Test document content');

      const mockFile = createMockFile({
        originalname: 'test-document.pdf',
        mimetype: 'application/pdf',
        size: docBuffer.length,
        buffer: docBuffer
      });

      const result = await photoService.saveStudentDocument(mockFile, TEST_STUDENT_ID, 'birth_certificate');

      expect(result.documentUrl).toContain(`/uploads/documents/students/${TEST_STUDENT_ID}/birth_certificate/`);
      expect(result.originalName).toBe('test-document.pdf');
      expect(result.mimeType).toBe('application/pdf');

      // Clean up
      const docPath = path.join(process.cwd(), result.documentUrl);
      if (fs.existsSync(docPath)) fs.unlinkSync(docPath);
    });
  });

  describe('listStudentDocuments', () => {
    it('should list documents for a student', async () => {
      // Create test documents
      const docBuffer = Buffer.from('Test content');
      const mockFile = createMockFile({
        originalname: 'list-test.pdf',
        mimetype: 'application/pdf',
        size: docBuffer.length,
        buffer: docBuffer
      });

      await photoService.saveStudentDocument(mockFile, TEST_STUDENT_ID, 'test_category');

      const documents = await photoService.listStudentDocuments(TEST_STUDENT_ID, 'test_category');

      expect(Array.isArray(documents)).toBe(true);
      expect(documents.length).toBeGreaterThan(0);
      expect(documents[0]).toHaveProperty('filename');
      expect(documents[0]).toHaveProperty('url');
      expect(documents[0]).toHaveProperty('category');

      // Clean up
      const docDir = path.join(TEST_PHOTO_DIR, String(TEST_STUDENT_ID), 'test_category');
      if (fs.existsSync(docDir)) {
        fs.rmSync(docDir, { recursive: true, force: true });
      }
    });

    it('should return empty array for non-existent student', async () => {
      const documents = await photoService.listStudentDocuments(999998);
      expect(documents).toEqual([]);
    });
  });

  describe('getPhotoDirectory', () => {
    it('should return correct directory path for student', () => {
      const studentId = 12345;
      const dir = photoService.getPhotoDirectory(studentId);
      expect(dir).toContain('uploads');
      expect(dir).toContain('students');
      expect(dir).toContain(String(studentId));
    });
  });
});
